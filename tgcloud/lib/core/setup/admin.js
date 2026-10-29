import { ROLE } from '../roles.js';
import { setUserRole } from '../../repository/users.js';
import { configureAdminCommands, resetAdminCommands } from './configuration.js';

export async function grantAdmin(input) {
  const telegramUserId = parseTelegramUserId(input.telegramUserId);

  await setUserRole(telegramUserId, ROLE.ADMIN);
  await configureAdminCommands(telegramUserId);

  return { ok: true };
}

export async function revokeAdmin(input) {
  const telegramUserId = parseTelegramUserId(input.telegramUserId);

  await setUserRole(telegramUserId, ROLE.USER);
  await resetAdminCommands(telegramUserId);

  return { ok: true };
}

function parseTelegramUserId(value) {
  const telegramUserId = Number(value);

  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    throw new Error('Invalid Telegram user ID');
  }

  return telegramUserId;
}
