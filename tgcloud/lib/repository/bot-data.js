import { db } from 'sdk';

import {
  orders,
  pollLocks,
  subscriptions,
  users,
} from '../../schema.js';

export async function getDatabaseStats() {
  const [userCount, orderCount, subscriptionCount] = await Promise.all([
    db.$count(users),
    db.$count(orders),
    db.$count(subscriptions),
  ]);

  return {
    users: userCount,
    orders: orderCount,
    subscriptions: subscriptionCount,
  };
}

export async function clearBotData() {
  const stats = await getDatabaseStats();

  await db.delete(subscriptions).run();
  await db.delete(orders).run();
  await db.delete(users).run();
  await db.delete(pollLocks).run();

  return {
    deleted: {
      users: stats.users,
      orders: stats.orders,
      subscriptions: stats.subscriptions,
    },
    preserved: { settings: true },
  };
}
