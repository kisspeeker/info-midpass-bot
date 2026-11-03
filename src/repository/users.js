import { DEFAULT_LOCALE, ROLE, ROLE_LEVEL, STATUS_REFRESH_COOLDOWN_MS, SUPPORT_REQUEST_COOLDOWN_MS } from '../constants.js';
import { localeFrom } from '../i18n/index.js';
import { unixTimeNow, millisecondsToSeconds } from '../helpers/time.js';

export function createUsers(sqlite) {
  function getById(id) {
    return sqlite.prepare('SELECT * FROM users WHERE telegramUserId = ?').get(id) ?? null;
  }

  function getRole(id) {
    return getById(id)?.role ?? ROLE.USER;
  }

  function claimCooldown(id, field, duration) {
    const user = getById(id);

    if (user?.role === ROLE.ADMIN) {
      return 0;
    }

    const now = unixTimeNow();
    const cooldown = millisecondsToSeconds(duration);
    const claimed = sqlite.prepare(`UPDATE users SET ${field} = ?
      WHERE telegramUserId = ? AND (${field} IS NULL OR ${field} <= ?)`)
      .run(now, id, now - cooldown).changes > 0;

    return claimed ? 0 : Math.max(1, cooldown - (now - (user?.[field] ?? 0)));
  }

  return {
    ensure(user) {
      sqlite.prepare('INSERT INTO users (telegramUserId, languageCode) VALUES (?, ?) ON CONFLICT DO NOTHING')
        .run(user.id, localeFrom(user.language_code));

      return getById(user.id);
    },
    getLocale(id) {
      return getById(id)?.languageCode ?? DEFAULT_LOCALE;
    },
    setLocale(id, languageCode) {
      sqlite.prepare('UPDATE users SET languageCode = ? WHERE telegramUserId = ?').run(languageCode, id);
    },
    getRole,
    hasRole(id, role) {
      return ROLE_LEVEL[getRole(id)] >= ROLE_LEVEL[role];
    },
    setRole(id, role) {
      if (!Number.isSafeInteger(id) || id <= 0 || !Object.hasOwn(ROLE_LEVEL, role)) {
        throw new Error('Invalid user role');
      }

      sqlite.prepare(`INSERT INTO users (telegramUserId, role) VALUES (?, ?)
        ON CONFLICT (telegramUserId) DO UPDATE SET role = excluded.role`).run(id, role);
    },
    admins() {
      return sqlite.prepare('SELECT telegramUserId, languageCode, role FROM users WHERE role = ?').all(ROLE.ADMIN);
    },
    claimStatusRefresh: (id) => claimCooldown(id, 'lastStatusRequestAt', STATUS_REFRESH_COOLDOWN_MS),
    claimSupportRequest: (id) => claimCooldown(id, 'lastSupportRequestAt', SUPPORT_REQUEST_COOLDOWN_MS),
    remove(id) {
      sqlite.transaction(() => {
        sqlite.prepare('DELETE FROM users WHERE telegramUserId = ?').run(id);
        sqlite.exec('DELETE FROM orders WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE orderUid = orders.uid)');
      })();
    },
  };
}
