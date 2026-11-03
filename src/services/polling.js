import PQueue from 'p-queue';

import { INVALID_PASSPORT_RETENTION_SECONDS } from '../constants.js';
import { unixTimeNow } from '../helpers/time.js';
import { hasPassportChanged, isFinalPassportStatus } from '../commands/passport/status.js';

const emptySummary = () => ({ checked: 0, changed: 0, failed: 0, notified: 0 });

export function createPollingService({ passports, subscriptions, users, fetchPassport, notify, signal, logger, now = unixTimeNow }) {
  const updates = new PQueue({ concurrency: 1 });

  function refresh(input, { notifySubscribers = false, summary = emptySummary() } = {}) {
    // Do not abort the queue promise early: shutdown must await the actual work.
    return updates.add(async () => {
      signal?.throwIfAborted();
      passports.update(input.uid, { lastAttemptAt: now() });

      let passport;

      try {
        passport = await fetchPassport(input);
      } catch (error) {
        if (!signal?.aborted
          && ['passport_not_found', 'invalid_passport_uid'].includes(error?.code)
          && passports.removeStale({ uid: input.uid, before: now() - INVALID_PASSPORT_RETENTION_SECONDS })) {
          logger?.info('stale_passport_removed', { uid: input.uid });
        }

        throw error;
      }

      signal?.throwIfAborted();

      return applyUpdate(input.uid, passport, { notifySubscribers, summary });
    });
  }

  async function applyUpdate(uid, passport, { notifySubscribers, summary }) {
    const order = passports.getById(uid);
    const subscribers = subscriptions.listByPassport(uid);

    if (!order || !subscribers.length) {
      return null;
    }

    const update = { ...passport, checkedAt: now() };
    const nextOrder = { ...order, ...update };
    let delivered = true;

    summary.checked += 1;

    const changed = hasPassportChanged(order, passport);

    if (changed) {
      summary.changed += 1;
    }

    if (changed && notifySubscribers) {
      for (const subscriber of subscribers) {
        signal?.throwIfAborted();

        try {
          const result = await notify.subscriber(subscriber.telegramUserId, nextOrder);

          if (result === 'blocked') {
            users.remove(subscriber.telegramUserId);
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

    // Keep the previous status on delivery failure so the next poll retries it.
    passports.update(uid, delivered ? update : { checkedAt: update.checkedAt });

    logger?.info('passport_check_completed', { uid, type: order.type, changed, delivered, subscribers: subscribers.length });

    return nextOrder;
  }

  return {
    refresh,
    async run({ limit } = {}) {
      if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) {
        throw new Error('Polling limit must be a positive safe integer');
      }

      const summary = emptySummary();

      try {
        const orders = passports.listSubscribed().filter((order) => !isFinalPassportStatus(order)).slice(0, limit);

        for (const candidate of orders) {
          signal?.throwIfAborted();

          try {
            await refresh({ ...candidate, allowPending: true }, { notifySubscribers: true, summary });
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

        const code = (error)?.code;

        return { done: false, summary, error: code ?? 'polling_failed' };
      }
    },
  };
}
