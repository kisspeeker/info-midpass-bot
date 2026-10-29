import { clearBotData, getDatabaseStats } from '../../repository/bot-data.js';
import { ROLE } from '../roles.js';
import { getAdmins, getUserRole, removeUser } from '../../repository/users.js';
import { resetAdminCommands } from './configuration.js';

const CLEAR_CONFIRMATION = 'DELETE BOT DATA';

export async function databaseStats() {
  return getDatabaseStats();
}

export async function deleteUser(input) {
  const telegramUserId = Number(input.telegramUserId);

  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    throw new Error('Invalid Telegram user ID');
  }

  const wasAdmin = await getUserRole(telegramUserId) === ROLE.ADMIN;

  await removeUser(telegramUserId);

  if (wasAdmin) {
    await resetAdminCommands(telegramUserId);
  }

  return { ok: true, telegramUserId };
}

export async function clearDatabase(input) {
  if (input.confirm !== CLEAR_CONFIRMATION) {
    throw new Error(`Confirmation must be: ${CLEAR_CONFIRMATION}`);
  }

  for (const admin of await getAdmins()) {
    await resetAdminCommands(admin.telegramUserId);
  }

  return clearBotData();
}
