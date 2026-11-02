import { passportRow } from './passports.js';

export function createSubscriptionsRepository(sqlite, passports) {
  return {
    getById(userId, uid) {
      return sqlite.prepare('SELECT * FROM subscriptions WHERE telegramUserId = ? AND orderUid = ?').get(userId, uid) ?? null;
    },
    countByUser(userId) {
      return sqlite.prepare('SELECT count(*) AS count FROM subscriptions WHERE telegramUserId = ?').get(userId).count;
    },
    listByUser(userId) {
      return sqlite.prepare(`SELECT orders.* FROM orders JOIN subscriptions ON orderUid = orders.uid
        WHERE telegramUserId = ?`).all(userId).map(passportRow);
    },
    listByPassport(uid) {
      return sqlite.prepare('SELECT telegramUserId FROM subscriptions WHERE orderUid = ?').all(uid);
    },
    create({ userId, order }) {
      return sqlite.transaction(() => {
        if (!passports.getById(order.uid)) {
          passports.save(order);
        }

        return sqlite.prepare('INSERT INTO subscriptions (telegramUserId, orderUid) VALUES (?, ?) ON CONFLICT DO NOTHING').run(userId, order.uid).changes > 0;
      })();
    },
    remove(userId, uid) {
      return sqlite.transaction(() => {
        sqlite.prepare('DELETE FROM subscriptions WHERE telegramUserId = ? AND orderUid = ?').run(userId, uid);
        sqlite.prepare(`DELETE FROM orders WHERE uid = ?
          AND NOT EXISTS (SELECT 1 FROM subscriptions WHERE orderUid = orders.uid)`).run(uid);
      })();
    },
  };
}
