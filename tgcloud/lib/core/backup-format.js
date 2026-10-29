import {
  BACKUP_FORMAT_VERSION,
  BACKUP_TABLE_NAMES,
  LEGACY_TYPE_UID_MAX_LENGTH,
  PASSPORT_TYPE,
} from './constants.js';
import { ROLE_LEVEL } from './roles.js';
import { toUnixTime } from '../helpers/time.js';

const BIOMETRIC_UID_PATTERN = /^\d{25}$/;
const LEGACY_UID_PATTERN = /^\d+$/;
const TABLE_PARSERS = Object.freeze({
  users: parseUser,
  orders: parseOrder,
  subscriptions: parseSubscription,
});

export function validateBackupDocument(data) {
  if (!isValidBackupDocument(data)) {
    throw new Error('Invalid TgCloud backup');
  }

  const tables = Object.fromEntries(BACKUP_TABLE_NAMES.map((name) => [
    name,
    parseBackupRows(name, data.tables[name]),
  ]));

  validateRelations(tables);

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    createdAt: data.createdAt,
    tables,
  };
}

export function parseBackupRows(tableName, rows) {
  const parse = TABLE_PARSERS[tableName];

  if (!parse || !Array.isArray(rows)) {
    throw new Error('Invalid backup table');
  }

  return rows.map(parse);
}

function validateRelations(tables) {
  const userIds = uniqueKeys(tables.users, (user) => user.telegramUserId, 'user');
  const orderUids = uniqueKeys(tables.orders, (order) => order.uid, 'order');

  uniqueKeys(
    tables.subscriptions,
    (subscription) => `${subscription.telegramUserId}:${subscription.orderUid}`,
    'subscription',
  );

  for (const subscription of tables.subscriptions) {
    if (!hasSubscriptionRelations(subscription, userIds, orderUids)) {
      throw new Error('Backup contains an orphan subscription');
    }
  }
}

function isValidBackupDocument(data) {
  if (data?.formatVersion !== BACKUP_FORMAT_VERSION) {
    return false;
  }

  if (typeof data.createdAt !== 'string' || !isPlainObject(data.tables)) {
    return false;
  }

  const hasAllTables = BACKUP_TABLE_NAMES.every((name) => Array.isArray(data.tables[name]));
  const hasUnknownTables = Object.keys(data.tables)
    .some((name) => !BACKUP_TABLE_NAMES.includes(name));

  return hasAllTables && !hasUnknownTables;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasSubscriptionRelations(subscription, userIds, orderUids) {
  return userIds.has(subscription.telegramUserId) && orderUids.has(subscription.orderUid);
}

function uniqueKeys(rows, getKey, type) {
  const keys = new Set();

  for (const row of rows) {
    const key = getKey(row);

    if (keys.has(key)) {
      throw new Error(`Backup contains a duplicate ${type}`);
    }

    keys.add(key);
  }

  return keys;
}

function parseUser(value) {
  const telegramUserId = positiveInteger(value?.telegramUserId);
  const languageCode = nonEmptyString(value?.languageCode);
  const role = String(value?.role ?? '');

  if (!telegramUserId || !languageCode || !Object.hasOwn(ROLE_LEVEL, role)) {
    throw new Error('Invalid user backup row');
  }

  return {
    telegramUserId,
    languageCode,
    role,
  };
}

function parseOrder(value) {
  const uid = String(value?.uid ?? '');
  const type = value?.type;
  const checkedAt = requiredTimestamp(value?.checkedAt);
  const validUid = isValidOrderUid(uid, type);

  if (!validUid) {
    throw new Error('Invalid order backup row');
  }

  return {
    uid,
    type,
    statusText: nullableString(value.statusText),
    checkedAt,
    sourceUid: nullableString(value.sourceUid),
    receptionDate: nullableString(value.receptionDate),
    passportStatusId: nullableInteger(value.passportStatusId),
    passportStatusName: nullableString(value.passportStatusName),
    passportStatusDescription: nullableString(value.passportStatusDescription),
    passportStatusColor: nullableString(value.passportStatusColor),
    passportStatusSubscription: nullableBoolean(value.passportStatusSubscription),
    internalStatusName: nullableString(value.internalStatusName),
    internalStatusPercent: nullablePercent(value.internalStatusPercent),
  };
}

function isValidOrderUid(uid, type) {
  if (type === PASSPORT_TYPE.BIOMETRIC) {
    return BIOMETRIC_UID_PATTERN.test(uid);
  }

  if (type === PASSPORT_TYPE.LEGACY_TYPE) {
    return LEGACY_UID_PATTERN.test(uid) && uid.length <= LEGACY_TYPE_UID_MAX_LENGTH;
  }

  return false;
}

function parseSubscription(value) {
  const telegramUserId = positiveInteger(value?.telegramUserId);
  const orderUid = nonEmptyString(value?.orderUid);

  if (!telegramUserId || !orderUid) {
    throw new Error('Invalid subscription backup row');
  }

  return {
    telegramUserId,
    orderUid,
  };
}

function positiveInteger(value) {
  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function nullableString(value) {
  return value == null || value === '' ? null : String(value);
}

function nullableInteger(value) {
  if (value == null) {
    return null;
  }

  if (!Number.isInteger(value)) {
    throw new Error('Invalid integer backup value');
  }

  return value;
}

function nullablePercent(value) {
  const number = nullableInteger(value);

  if (number != null && (number < 0 || number > 100)) {
    throw new Error('Invalid percent backup value');
  }

  return number;
}

function nullableBoolean(value) {
  if (value == null || typeof value === 'boolean') {
    return value ?? null;
  }

  throw new Error('Invalid boolean backup value');
}

function requiredTimestamp(value) {
  const timestamp = toUnixTime(value);

  if (timestamp == null) {
    throw new Error('Invalid timestamp backup value');
  }

  return timestamp;
}
