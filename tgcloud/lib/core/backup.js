import { db } from 'sdk';

import { orders, subscriptions, users } from '../../schema.js';
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_OUTPUT_PREFIX,
} from './constants.js';

const TABLE_QUERIES = Object.freeze({
  users: () => db.select({
    telegramUserId: users.telegramUserId,
    languageCode: users.languageCode,
    role: users.role,
  }).from(users).all(),
  orders: () => db.select({
    uid: orders.uid,
    type: orders.type,
    statusText: orders.statusText,
    checkedAt: orders.checkedAt,
    sourceUid: orders.sourceUid,
    receptionDate: orders.receptionDate,
    passportStatusId: orders.passportStatusId,
    passportStatusName: orders.passportStatusName,
    passportStatusDescription: orders.passportStatusDescription,
    passportStatusColor: orders.passportStatusColor,
    passportStatusSubscription: orders.passportStatusSubscription,
    internalStatusName: orders.internalStatusName,
    internalStatusPercent: orders.internalStatusPercent,
  }).from(orders).all(),
  subscriptions: () => db.select({
    telegramUserId: subscriptions.telegramUserId,
    orderUid: subscriptions.orderUid,
  }).from(subscriptions).all(),
});

export default async function backup() {
  const entries = await Promise.all(Object.entries(TABLE_QUERIES).map(async ([name, query]) => (
    [name, await query()]
  )));
  const data = {
    formatVersion: BACKUP_FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    tables: Object.fromEntries(entries),
  };

  return `${BACKUP_OUTPUT_PREFIX}${JSON.stringify(data)}`;
}
