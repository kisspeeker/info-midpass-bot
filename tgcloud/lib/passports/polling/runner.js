import { logger } from '../../core/logger.js';
import { POLL_CONCURRENCY } from '../../core/constants.js';
import { unixTimeNow } from '../../helpers/time.js';
import { getPassports, updatePassport } from '../../repository/passports.js';
import { getSubscribersByOrder } from '../../repository/subscriptions.js';
import { renewPollingLock } from '../../repository/polling-lock.js';
import { fetchPassport } from '../api/index.js';
import { hasPassportChanged, isFinalPassportStatus } from '../status/index.js';
import { notifyAdmins, notifySubscriber } from './notify.js';

export async function runPolling(lockToken) {
  const subscribersByOrder = await getSubscribersByOrder();
  const trackedOrders = (await getPassports())
    .filter((order) => subscribersByOrder.has(order.uid));
  const summary = { checked: 0, changed: 0, failed: 0, notified: 0 };
  const i18nByUser = new Map();
  const pendingOrders = trackedOrders.filter((order) => !isFinalPassportStatus(order));
  let nextOrderIndex = 0;

  async function pollNextOrder() {
    while (nextOrderIndex < pendingOrders.length) {
      const order = pendingOrders[nextOrderIndex];

      nextOrderIndex += 1;
      await renewPollingLock(lockToken);

      try {
        await pollOrder({
          order,
          subscribers: subscribersByOrder.get(order.uid),
          summary,
          i18nByUser,
        });
      } catch (error) {
        summary.failed += 1;
        logger.error('passport_poll_failed', error, {
          type: order.type,
          uid: order.uid,
        });
      }
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(POLL_CONCURRENCY, pendingOrders.length) },
    pollNextOrder,
  ));

  logger.info('passport_polling_completed', summary);
  await notifyAdmins(summary);

  return summary;
}

async function pollOrder(input) {
  const {
    order,
    subscribers,
    summary,
    i18nByUser,
  } = input;
  const passport = await fetchPassport({ type: order.type, uid: order.uid });
  const changed = hasPassportChanged(order, passport);
  const orderUpdate = { ...passport, checkedAt: unixTimeNow() };
  const updatedOrder = { ...order, ...orderUpdate };

  await updatePassport(order.uid, orderUpdate);
  summary.checked += 1;

  if (!changed) {
    return;
  }

  summary.changed += 1;

  for (const subscription of subscribers) {
    await notifySubscriber({
      telegramUserId: subscription.telegramUserId,
      order: updatedOrder,
      summary,
      i18nByUser,
    });
  }
}
