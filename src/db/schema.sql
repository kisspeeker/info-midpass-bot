CREATE TABLE IF NOT EXISTS users (
    telegramUserId INTEGER PRIMARY KEY,
    languageCode TEXT NOT NULL DEFAULT 'ru',
    role TEXT NOT NULL DEFAULT 'user',
    lastStatusRequestAt INTEGER,
    lastSupportRequestAt INTEGER
  );
CREATE TABLE IF NOT EXISTS orders (
    uid TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    statusText TEXT,
    checkedAt INTEGER NOT NULL DEFAULT (unixepoch()),
    lastAttemptAt INTEGER NOT NULL DEFAULT 0,
    sourceUid TEXT,
    receptionDate TEXT,
    passportStatusId INTEGER,
    passportStatusName TEXT,
    passportStatusDescription TEXT,
    passportStatusColor TEXT,
    passportStatusSubscription INTEGER,
    internalStatusName TEXT,
    internalStatusPercent INTEGER
  );
CREATE TABLE IF NOT EXISTS subscriptions (
    telegramUserId INTEGER NOT NULL REFERENCES users(telegramUserId) ON DELETE CASCADE,
    orderUid TEXT NOT NULL REFERENCES orders(uid) ON DELETE CASCADE,
    PRIMARY KEY (telegramUserId, orderUid)
  );
CREATE INDEX IF NOT EXISTS subscriptions_order_uid_idx ON subscriptions(orderUid);
PRAGMA user_version = 1;
