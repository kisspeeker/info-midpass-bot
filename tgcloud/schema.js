import { boolean, index, integer, primaryKey, sql, table, text } from 'sdk/db';

const DEFAULT_LOCALE = 'ru';
const DEFAULT_PASSPORT_TYPE = 'BIOMETRIC';
const DEFAULT_ROLE = 'user';

export const users = table('users', {
  telegramUserId: integer('telegram_user_id').primaryKey(),
  languageCode: text('language_code').notNull().default(DEFAULT_LOCALE),
  role: text('role').notNull().default(DEFAULT_ROLE),
  lastStatusRequestAt: integer('last_status_request_at', { mode: 'timestamp' }),
  lastSupportRequestAt: integer('last_support_request_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .deprecated('Only Telegram user ID is stored'),
});

export const orders = table('orders', {
  uid: text('uid').primaryKey(),
  type: text('type').notNull().default(DEFAULT_PASSPORT_TYPE),
  statusText: text('status_text'),
  checkedAt: integer('checked_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  shortUid: text('short_uid').deprecated('Replaced by uid'),
  passportYears: integer('passport_years').deprecated('Replaced by type'),
  sourceUid: text('source_uid'),
  receptionDate: text('reception_date'),
  passportStatusId: integer('passport_status_id'),
  passportStatusName: text('passport_status_name'),
  passportStatusDescription: text('passport_status_description'),
  passportStatusColor: text('passport_status_color'),
  passportStatusSubscription: boolean('passport_status_subscription'),
  internalStatusName: text('internal_status_name'),
  internalStatusPercent: integer('internal_status_percent'),
  updateTime: integer('update_time', { mode: 'timestamp' }).deprecated('Replaced by checked_at'),
});

export const subscriptions = table('subscriptions', {
  telegramUserId: integer('telegram_user_id').notNull(),
  orderUid: text('order_uid').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (subscription) => ({
  subscriptionPk: primaryKey({
    columns: [subscription.telegramUserId, subscription.orderUid],
  }),
  byOrder: index('subscriptions_order_uid_idx').on(subscription.orderUid),
}));

export const pollLocks = table('poll_locks', {
  name: text('name').primaryKey(),
  token: text('token'),
  lockedUntil: integer('locked_until', { mode: 'timestamp' })
    .notNull()
    .default(sql`0`),
});

export const settings = table('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
