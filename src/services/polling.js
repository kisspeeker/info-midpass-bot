import PQueue from 'p-queue';

import { INVALID_PASSPORT_RETENTION_SECONDS } from '../config.js';
import { unixTimeNow } from '../lib/time.js';
import { hasPassportChanged, isFinalPassportStatus } from './passport-status.js';

const emptySummary = () => ({ checked: 0, changed: 0, failed: 0, notified: 0 });

/** @param {{
 *   passports: import('../types/index.js').PassportRepository,
 *   subscriptions: import('../types/index.js').SubscriptionRepository,
 *   users: import('../types/index.js').UserService,
 *   fetchPassport: import('../types/index.js').FetchPassport,
 *   notify: import('../types/index.js').Notifier,
 *   signal?: AbortSignal,
 *   logger?: import('../types/index.js').Logger,
 *   now?: () => number,
 * }} dependencies */
export function createPollingService({ passports, subscriptions, users, fetchPassport, notify, signal, logger, now = unixTimeNow }) {
  const updates = new PQueue({ concurrency: 1 });

  /** @param {Parameters<import('../types/index.js').FetchPassport>[0]} input */
  function refresh(input, summary = emptySummary()) {
    // Do not abort the queue promise early: shutdown must await the actual work.
    return updates.add(async () => {
      signal?.throwIfAborted();
      await passports.update(input.uid, { lastAttemptAt: now() });

      let passport;

      try {
        passport = await fetchPassport(input);
      } catch (error) {
        if (!signal?.aborted
          && ['passport_not_found', 'invalid_passport_uid', 'invalid_upstream_json', 'invalid_upstream_response'].includes(error?.code)
          && await passports.removeStale({ uid: input.uid, before: now() - INVALID_PASSPORT_RETENTION_SECONDS })) {
          logger?.info('stale_passport_removed', { uid: input.uid });
        }

        throw error;
      }

      signal?.throwIfAborted();

      return applyUpdate(input.uid, passport, summary);
    });
  }

  /** @param {string} uid @param {Partial<import('../types/index.js').Passport>} passport */
  async function applyUpdate(uid, passport, summary = emptySummary()) {
    const order = await passports.getById(uid);
    const subscribers = await subscriptions.listByPassport(uid);

    if (!order || !subscribers.length) {
      return null;
    }

    const update = { ...passport, checkedAt: now() };
    let delivered = true;

    summary.checked += 1;

    const changed = hasPassportChanged(order, passport);

    if (changed) {
      summary.changed += 1;

      for (const subscriber of subscribers) {
        signal?.throwIfAborted();
        try {
          const result = await notify.subscriber(subscriber.telegramUserId, { ...order, ...update });

          if (result === 'blocked') {
            await users.remove(subscriber.telegramUserId);
          } else {
            summary.notified += 1;
          }
        } catch (error) {
          delivered = false;
          summary.failed += 1;
          logger?.error('passport_subscriber_notify_failed', error, { uid });
        }
      }
    }

    // Keep the previous baseline on delivery failure so the next poll retries it.
    // A crash/partial delivery can repeat messages; historical transitions are not retained.
    await passports.update(uid, delivered ? update : { checkedAt: update.checkedAt });

    logger?.info('passport_check_completed', { uid, type: order.type, changed, delivered, subscribers: subscribers.length });

    return { ...order, ...update };
  }

  return {
    refresh,
    /** @param {{limit?: number}} input */
    async run({ limit } = {}) {
      if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) {
        throw new Error('Polling limit must be a positive safe integer');
      }

      const summary = emptySummary();

      try {
        const orders = (await passports.listSubscribed()).filter((order) => !isFinalPassportStatus(order)).slice(0, limit);

        for (const candidate of orders) {
          signal?.throwIfAborted();

          try {
            await refresh({ ...candidate, allowPending: true }, summary);
          } catch (error) {
            summary.failed += 1;
            logger?.error('passport_poll_failed', error, { type: candidate.type, uid: candidate.uid });

            if (signal?.aborted) {
              throw error;
            }
          }
        }

        logger?.info('passport_polling_completed', summary);

        return { done: true, summary };
      } catch (error) {
        logger?.error('passport_polling_failed', error, summary);

        const code = /** @type {{code?: string}} */ (error)?.code;

        return { done: false, summary, error: code ?? 'polling_failed' };
      }
    },
  };
}
