import { db } from 'sdk';

import {
  BACKUP_RESTORE_BATCH_SIZE,
  BACKUP_TABLE_NAMES,
} from '../constants.js';
import { parseBackupRows } from '../backup-format.js';
import { orders, subscriptions, users } from '../../../schema.js';

const RESTORE_HANDLERS = Object.freeze({
  users: restoreUsers,
  orders: restoreOrders,
  subscriptions: restoreSubscriptions,
});

export async function restoreBackup(input) {
  const tableName = String(input.table ?? '');
  const rows = input.rows;
  const restore = RESTORE_HANDLERS[tableName];

  if (
    !BACKUP_TABLE_NAMES.includes(tableName)
    || !restore
    || !Array.isArray(rows)
    || rows.length < 1
    || rows.length > BACKUP_RESTORE_BATCH_SIZE
  ) {
    throw new Error('Invalid backup restore batch');
  }

  return {
    table: tableName,
    restored: await restore(rows),
  };
}

async function restoreUsers(rows) {
  const values = parseBackupRows('users', rows);

  for (const user of values) {
    const updates = { ...user };

    delete updates.telegramUserId;

    await db.insert(users).values(user).onConflictDoUpdate({
      target: users.telegramUserId,
      set: updates,
    }).run();
  }

  return values.length;
}

async function restoreOrders(rows) {
  const values = parseBackupRows('orders', rows);

  for (const order of values) {
    const updates = { ...order };

    delete updates.uid;

    await db.insert(orders).values(order).onConflictDoUpdate({
      target: orders.uid,
      set: updates,
    }).run();
  }

  return values.length;
}

async function restoreSubscriptions(rows) {
  const values = parseBackupRows('subscriptions', rows);

  for (const subscription of values) {
    await db.insert(subscriptions).values(subscription).onConflictDoNothing().run();
  }

  return values.length;
}
