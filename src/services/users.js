import { DEFAULT_LOCALE, ROLE, ROLE_LEVEL, STATUS_REFRESH_COOLDOWN_MS, SUPPORT_REQUEST_COOLDOWN_MS } from '../config.js';
import { SUPPORTED_LOCALES } from '../i18n/constants.js';
import { unixTimeNow, millisecondsToSeconds } from '../lib/time.js';

/**
 * @param {{users: import('../types/index.js').UserRepository, logger?: import('../types/index.js').Logger, now?: () => number}} dependencies
 * @returns {import('../types/index.js').UserService}
 */
export function createUserService({ users, logger, now = unixTimeNow }) {
  async function getRole(id) {
    return (await users.getById(id))?.role ?? ROLE.USER;
  }

  async function claimCooldown(id, field, duration) {
    const user = await users.getById(id);

    if (user?.role === ROLE.ADMIN) {
      return 0;
    }

    const timestamp = now();
    const cooldown = millisecondsToSeconds(duration);
    const claimed = await users.claimCooldown({ id, field, now: timestamp, cutoff: timestamp - cooldown });

    return claimed ? 0 : Math.max(1, cooldown - (timestamp - (user?.[field] ?? 0)));
  }

  return {
    async register(id, languageCode = DEFAULT_LOCALE) {
      if (await users.create({ telegramUserId: id, languageCode })) {
        logger?.info('user_registered', { telegramUserId: id, languageCode });
      }

      return (await users.getById(id))?.languageCode ?? languageCode;
    },
    async getLocale(id) {
      return (await users.getById(id))?.languageCode ?? DEFAULT_LOCALE;
    },
    async setLocale(id, languageCode) {
      const locale = SUPPORTED_LOCALES.find((supported) => supported === languageCode);

      if (!locale) {
        throw new Error('Invalid language');
      }

      await users.update(id, { languageCode: locale });
    },
    getRole,
    async hasRole(id, role) {
      if (!Object.hasOwn(ROLE_LEVEL, role)) {
        throw new Error(`Unknown role: ${role}`);
      }

      return (ROLE_LEVEL[await getRole(id)] ?? -1) >= ROLE_LEVEL[role];
    },
    async setRole(id, role) {
      if (!Number.isSafeInteger(id) || id <= 0 || !Object.hasOwn(ROLE_LEVEL, role)) {
        throw new Error('Invalid user role');
      }

      await users.saveRole(id, role);
    },
    admins: () => users.listByRole(ROLE.ADMIN),
    remove: (id) => users.remove(id),
    claimStatusRefresh: (id) => claimCooldown(id, 'lastStatusRequestAt', STATUS_REFRESH_COOLDOWN_MS),
    claimSupportRequest: (id) => claimCooldown(id, 'lastSupportRequestAt', SUPPORT_REQUEST_COOLDOWN_MS),
  };
}
