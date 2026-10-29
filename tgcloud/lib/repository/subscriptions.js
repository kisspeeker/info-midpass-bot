import { db } from 'sdk';
import { and, eq } from 'sdk/db';

import { orders, subscriptions } from '../../schema.js';

export async function findSubscription(telegramUserId, orderUid) {
  return db.select().from(subscriptions).where(and(
    eq(subscriptions.telegramUserId, telegramUserId),
    eq(subscriptions.orderUid, orderUid),
  )).get();
}

export async function countSubscriptions(telegramUserId) {
  return db.$count(subscriptions, eq(subscriptions.telegramUserId, telegramUserId));
}

export async function addSubscription(telegramUserId, orderUid) {
  await db.insert(subscriptions).values({ telegramUserId, orderUid })
    .onConflictDoNothing()
    .run();
}

export async function getSubscribedOrders(telegramUserId) {
  const rows = await db.select().from(subscriptions)
    .where(eq(subscriptions.telegramUserId, telegramUserId))
    .all();
  const subscribedOrders = await Promise.all(rows.map((row) => (
    db.select().from(orders)
      .where(eq(orders.uid, row.orderUid))
      .get()
  )));

  return subscribedOrders.filter(Boolean);
}

export async function getSubscribersByOrder() {
  const result = new Map();

  for (const subscription of await db.select().from(subscriptions).all()) {
    const subscribers = result.get(subscription.orderUid) ?? [];

    subscribers.push(subscription);
    result.set(subscription.orderUid, subscribers);
  }

  return result;
}

export async function removeSubscription(telegramUserId, orderUid) {
  await db.delete(subscriptions).where(and(
    eq(subscriptions.telegramUserId, telegramUserId),
    eq(subscriptions.orderUid, orderUid),
  )).run();
  await removeOrderWithoutSubscribers(orderUid);
}

export async function removeOrderWithoutSubscribers(orderUid) {
  await db.run(`
    DELETE FROM orders
    WHERE uid = :uid
      AND NOT EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE order_uid = :uid
      )
  `, { ':uid': orderUid });
}
