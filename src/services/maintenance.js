import { ROLE } from '../config.js';

/** @param {{maintenance: import('../types/index.js').MaintenanceRepository, users: import('../types/index.js').UserService}} dependencies */
export function createMaintenanceService({ maintenance, users }) {
  return {
    getStats: () => maintenance.getStats(),
    async setup(input = {}) {
      const id = input.telegramUserId;

      switch (input.action) {
        case 'databaseStats':
          return maintenance.getStats();
        case 'grantAdmin':
        case 'revokeAdmin':
          await users.setRole(id, input.action === 'grantAdmin' ? ROLE.ADMIN : ROLE.USER);

          return { ok: true };
        case 'deleteUser':
          if (!Number.isSafeInteger(id) || id <= 0) {
            throw new Error('Invalid Telegram user ID');
          }

          await users.remove(id);

          return { ok: true, telegramUserId: id };
        case 'clearDatabase':
          if (input.confirm !== 'DELETE BOT DATA') {
            throw new Error('Confirmation must be: DELETE BOT DATA');
          }

          return { deleted: await maintenance.clear() };
        default:
          throw new Error('Unknown setup action');
      }
    },
  };
}
