import { DB_PATH } from '../src/config.js';
import { ROLE } from '../src/constants.js';
import { logger } from '../src/services/logger.js';
import { openDatabase } from '../src/db/index.js';
import { createUsers } from '../src/repository/users.js';
import { createMaintenanceRepository } from '../src/repository/maintenance.js';
import { createMaintenanceService } from '../src/services/maintenance.js';

let database;

try {
  const input = JSON.parse(process.argv[2] ?? '{}');

  database = openDatabase(DB_PATH);

  const users = createUsers(database);
  const maintenance = createMaintenanceService({ maintenance: createMaintenanceRepository(database), users });
  const id = Number(input.telegramUserId);
  const deletingAdmin = input.action === 'deleteUser' && Number.isSafeInteger(id) && id > 0 && users.hasRole(id, ROLE.ADMIN);

  input.telegramUserId = id;

  const profileRequired = ['configureBot', 'grantAdmin', 'revokeAdmin'].includes(input.action)
    || deletingAdmin || (input.action === 'clearDatabase' && input.confirm === 'DELETE BOT DATA' && users.admins().length > 0);
  let profile;

  if (profileRequired) {
    const { createTelegramApi } = await import('../src/api/telegram.js');
    const { createProfileClient } = await import('../src/api/profile.js');

    profile = createProfileClient({ api: createTelegramApi(), users });
  }

  // Remove chat command scopes before deleting users, while their IDs still exist.
  if (input.action === 'clearDatabase' && input.confirm === 'DELETE BOT DATA') {
    for (const admin of users.admins()) {
      await profile.resetAdmin(admin.telegramUserId);
    }
  }

  if (deletingAdmin) {
    await profile.resetAdmin(id);
  }

  const result = input.action === 'configureBot' ? await profile.configure() : maintenance.setup(input);

  if (['grantAdmin', 'revokeAdmin'].includes(input.action)) {
    await profile.configureChat(id);
  }

  console.log(JSON.stringify(result));
} catch (error) {
  logger.error('setup_failed', error);
  console.error('Setup failed: provide a valid setup action as JSON');
  process.exitCode = 1;
} finally {
  database?.close();
}
