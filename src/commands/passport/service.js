import { MAX_SUBSCRIPTIONS_PER_USER } from '../../constants.js';
import { unixTimeNow } from '../../helpers/time.js';
import { isPassportUid } from './uid.js';

export function createPassportService({ passports, subscriptions, users, fetchPassport, refreshPassport, logger, now = unixTimeNow }) {
  function getStatus(userId, uid) {
    if (!subscriptions.getById(userId, uid)) {
      return { status: 'notFound' };
    }

    const order = passports.getById(uid);

    return order ? { status: 'ok', order } : { status: 'applicationNotFound' };
  }

  return {
    getStatus,
    list: (id) => subscriptions.listByUser(id),
    hasSubscription(id, uid) {
      return Boolean(subscriptions.getById(id, uid));
    },
    async track(userId, { type, uid }) {
      if (!isPassportUid(uid, type)) {
        return { status: 'fetchFailed' };
      }

      try {
        const stored = passports.getById(uid);

        if (stored && stored.type !== type) {
          throw new Error('Passport type does not match the stored application');
        }

        if (stored && subscriptions.getById(userId, uid)) {
          return { status: 'alreadyTracked', order: stored };
        }

        if (subscriptions.countByUser(userId) >= MAX_SUBSCRIPTIONS_PER_USER) {
          return { status: 'limit' };
        }

        const order = stored ?? { uid, type, ...await fetchPassport({ type, uid, allowPending: true }), checkedAt: now() };

        if (subscriptions.create({ userId, order })) {
          logger?.info('subscription_created', { telegramUserId: userId, uid, type });
        }

        return { status: 'added', order };
      } catch (error) {
        logger?.error('passport_tracking_failed', error, { type, uid });

        return { status: 'fetchFailed' };
      }
    },
    async refresh(userId, { uid }) {
      const result = getStatus(userId, uid);

      if (result.status !== 'ok') {
        return result;
      }

      const retryAfter = users.claimStatusRefresh(userId);

      if (retryAfter) {
        return { status: 'recent', order: result.order };
      }

      try {
        const order = await refreshPassport({ type: result.order.type, uid, allowPending: true });

        return order ? { status: 'refreshed', order } : { status: 'notFound' };
      } catch (error) {
        logger?.error('passport_refresh_failed', error, { type: result.order.type, uid });

        return { status: 'refreshFailed', order: result.order };
      }
    },
    unsubscribe(userId, uid) {
      if (!subscriptions.getById(userId, uid)) {
        return { status: 'notFound' };
      }

      subscriptions.remove(userId, uid);
      logger?.info('subscription_removed', { telegramUserId: userId, uid });

      return { status: 'removed', orders: subscriptions.listByUser(userId) };
    },
  };
}
