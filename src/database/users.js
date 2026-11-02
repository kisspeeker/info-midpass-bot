import { DEFAULT_LOCALE } from '../i18n/constants.js';

export function createUsersRepository(sqlite) {
  return {
    getById(id) {
      return sqlite.prepare('SELECT * FROM users WHERE telegramUserId = ?').get(id) ?? null;
    },
    create({ telegramUserId, languageCode = DEFAULT_LOCALE }) {
      return sqlite.prepare('INSERT INTO users (telegramUserId, languageCode) VALUES (?, ?) ON CONFLICT DO NOTHING').run(telegramUserId, languageCode).changes > 0;
    },
    update(id, values) {
      const entries = Object.entries(values).filter(([key]) => ['languageCode', 'role'].includes(key));

      if (entries.length) {
        sqlite.prepare(`UPDATE users SET ${entries.map(([key]) => `${key} = ?`).join(', ')} WHERE telegramUserId = ?`)
          .run(...entries.map(([, value]) => value), id);
      }
    },
    saveRole(id, role) {
      sqlite.prepare(`INSERT INTO users (telegramUserId, role) VALUES (?, ?)
        ON CONFLICT (telegramUserId) DO UPDATE SET role = excluded.role`).run(id, role);
    },
    listByRole(role) {
      return sqlite.prepare('SELECT telegramUserId, languageCode, role FROM users WHERE role = ?').all(role);
    },
    claimCooldown({ id, field, now, cutoff }) {
      if (!['lastStatusRequestAt', 'lastSupportRequestAt'].includes(field)) {
        throw new Error('Invalid cooldown field');
      }

      return sqlite.prepare(`UPDATE users SET ${field} = ?
        WHERE telegramUserId = ? AND (${field} IS NULL OR ${field} <= ?)`)
        .run(now, id, cutoff).changes > 0;
    },
    remove(id) {
      sqlite.transaction(() => {
        sqlite.prepare('DELETE FROM users WHERE telegramUserId = ?').run(id);
        sqlite.exec('DELETE FROM orders WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE orderUid = orders.uid)');
      })();
    },
  };
}
