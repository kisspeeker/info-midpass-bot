import { db } from 'sdk';
import { eq } from 'sdk/db';

import { MAX_SUBSCRIPTIONS_PER_USER, PASSPORT_TYPE } from '../constants.js';
import { toUnixTime } from '../../helpers/time.js';
import { orders, subscriptions, users } from '../../../schema.js';

export async function importLegacy(input) {
  const records = input.records;

  if (!Array.isArray(records) || records.length > 25) {
    throw new Error('Invalid legacy import batch');
  }

  let imported = 0;

  for (const record of records) {
    const telegramUserId = Number(record?.telegramUserId);
    const order = parseOrder(record?.order);

    if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0 || !order) {
      continue;
    }

    const subscriptionCount = await db.$count(
      subscriptions,
      eq(subscriptions.telegramUserId, telegramUserId),
    );

    if (subscriptionCount >= MAX_SUBSCRIPTIONS_PER_USER) {
      continue;
    }

    await db.insert(users).values({ telegramUserId }).onConflictDoNothing().run();
    await db.insert(orders).values(order).onConflictDoNothing().run();

    const result = await db.insert(subscriptions)
      .values({ telegramUserId, orderUid: order.uid })
      .onConflictDoNothing()
      .run();

    imported += result.rowsAffected;
  }

  return { imported };
}

function parseOrder(value = {}) {
  const uid = String(value.uid ?? '');

  if (!/^\d{25}$/.test(uid)) {
    return null;
  }

  const checkedAt = toUnixTime(value.checkedAt);

  return {
    uid,
    type: PASSPORT_TYPE.BIOMETRIC,
    sourceUid: nullableString(value.sourceUid),
    receptionDate: nullableString(value.receptionDate),
    passportStatusId: Number.isInteger(value.passportStatusId)
      ? value.passportStatusId
      : null,
    passportStatusName: nullableString(value.passportStatusName),
    passportStatusDescription: nullableString(value.passportStatusDescription),
    passportStatusColor: nullableString(value.passportStatusColor),
    passportStatusSubscription: typeof value.passportStatusSubscription === 'boolean'
      ? value.passportStatusSubscription
      : null,
    internalStatusName: nullableString(value.internalStatusName),
    internalStatusPercent: Number.isInteger(value.internalStatusPercent)
      ? value.internalStatusPercent
      : null,
    ...(checkedAt == null ? {} : { checkedAt }),
  };
}

function nullableString(value) {
  return value == null || value === '' ? null : String(value);
}
