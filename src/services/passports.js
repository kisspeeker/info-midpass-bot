import { MAX_SUBSCRIPTIONS_PER_USER } from '../config.js';
import { unixTimeNow } from '../lib/time.js';
import { isPassportUid } from '../lib/passport-uid.js';

/**
 * @param {{
 *   passports: import('../types/index.js').PassportRepository,
 *   subscriptions: import('../types/index.js').SubscriptionRepository,
 *   users: import('../types/index.js').UserService,
 *   fetchPassport: import('../types/index.js').FetchPassport,
 *   refreshPassport: (input: Parameters<import('../types/index.js').FetchPassport>[0]) => Promise<import('../types/index.js').Passport | null>,
 *   logger?: import('../types/index.js').Logger,
 *   now?: () => number,
 * }} dependencies
 * @returns {import('../types/index.js').PassportService}
 */
export function createPassportService({ passports, subscriptions, users, fetchPassport, refreshPassport, logger, now = unixTimeNow }) {
  /** @param {number} userId @param {string} uid @returns {Promise<import('../types/index.js').OwnedPassportResult>} */
  async function getStatus(userId, uid) {
    if (!await subscriptions.getById(userId, uid)) {
      return { status: 'notFound' };
    }

    const order = await passports.getById(uid);

    return order ? { status: 'ok', order } : { status: 'applicationNotFound' };
  }

  return {
    getStatus,
    list: (id) => subscriptions.listByUser(id),
    async hasSubscription(id, uid) {
      return Boolean(await subscriptions.getById(id, uid));
    },
    async track(userId, { type, uid }) {
      if (!isPassportUid(uid, type)) {
        return { status: 'fetchFailed' };
      }

      try {
        const stored = await passports.getById(uid);

        if (stored && stored.type !== type) {
          throw new Error('Passport type does not match the stored application');
        }

        if (stored && await subscriptions.getById(userId, uid)) {
          return { status: 'alreadyTracked', order: stored };
        }

        if (await subscriptions.countByUser(userId) >= MAX_SUBSCRIPTIONS_PER_USER) {
          return { status: 'limit' };
        }

        const order = stored ?? { uid, type, ...await fetchPassport({ type, uid, allowPending: true }), checkedAt: now() };

        if (await subscriptions.create({ userId, order })) {
          logger?.info('subscription_created', { telegramUserId: userId, uid, type });
        }

        return { status: 'added', order };
      } catch (error) {
        logger?.error('passport_tracking_failed', error, { type, uid });

        return { status: 'fetchFailed' };
      }
    },
    async refresh(userId, { uid, showStatusOnCooldown = false }) {
      const result = await getStatus(userId, uid);

      if (result.status !== 'ok') {
        return result;
      }

      const retryAfter = await users.claimStatusRefresh(userId);

      if (retryAfter) {
        return { status: 'recent', ...(showStatusOnCooldown ? { order: result.order } : {}) };
      }

      try {
        const order = await refreshPassport({ type: result.order.type, uid, allowPending: true });

        return order ? { status: 'refreshed', order } : { status: 'notFound' };
      } catch (error) {
        logger?.error('passport_refresh_failed', error, { type: result.order.type, uid });

        return { status: 'refreshFailed' };
      }
    },
    async unsubscribe(userId, uid) {
      if (!await subscriptions.getById(userId, uid)) {
        return { status: 'notFound' };
      }

      await subscriptions.remove(userId, uid);
      logger?.info('subscription_removed', { telegramUserId: userId, uid });

      return { status: 'removed', orders: await subscriptions.listByUser(userId) };
    },
  };
}
