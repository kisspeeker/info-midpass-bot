import { BOT_COMMANDS, DB_PATH, ROLE } from '../src/config.js';
import { openDatabase } from '../src/database/db.js';
import { createRepositories } from '../src/database/index.js';
import { createUserService } from '../src/services/users.js';
import { createMaintenanceService } from '../src/services/maintenance.js';

let database;

try {
  const input = JSON.parse(process.argv[2] ?? '{}');

  database = openDatabase(DB_PATH);

  const repositories = createRepositories(database);
  const users = createUserService({ users: repositories.users });
  const maintenance = createMaintenanceService({ maintenance: repositories.maintenance, users });
  const id = Number(input.telegramUserId);
  const deletingAdmin = input.action === 'deleteUser' && Number.isSafeInteger(id) && id > 0 && await users.hasRole(id, ROLE.ADMIN);

  input.telegramUserId = id;

  const profileRequired = ['configureBot', 'grantAdmin', 'revokeAdmin'].includes(input.action)
    || deletingAdmin || (input.action === 'clearDatabase' && input.confirm === 'DELETE BOT DATA' && (await users.admins()).length > 0);
  let profile;

  if (profileRequired) {
    const { createTelegramApi } = await import('../src/api/telegram.js');
    const { createProfileClient } = await import('../src/api/profile.js');

    profile = createProfileClient({ api: createTelegramApi(), users, commands: BOT_COMMANDS });
  }

  // Remove chat command scopes before deleting users, while their IDs still exist.
  if (input.action === 'clearDatabase' && input.confirm === 'DELETE BOT DATA') {
    for (const admin of await users.admins()) {
      await profile.resetAdmin(admin.telegramUserId);
    }
  }

  if (deletingAdmin) {
    await profile.resetAdmin(id);
  }

  const result = input.action === 'configureBot' ? await profile.configure() : await maintenance.setup(input);

  if (input.action === 'grantAdmin') {
    await profile.configureAdmin(id);
  } else if (input.action === 'revokeAdmin') {
    await profile.configureChat(id);
  }

  console.log(JSON.stringify(result));
} catch {
  console.error('Setup failed: provide a valid setup action as JSON');
  process.exitCode = 1;
} finally {
  database?.close();
}
