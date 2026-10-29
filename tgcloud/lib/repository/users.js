import { db } from 'sdk';
import { and, eq, isNull, lt, or } from 'sdk/db';

import {
  DEFAULT_LOCALE,
  STATUS_REFRESH_COOLDOWN_MS,
  SUPPORT_REQUEST_COOLDOWN_MS,
} from '../core/constants.js';
import { ROLE, ROLE_LEVEL } from '../core/roles.js';
import { millisecondsToSeconds, toUnixTime, unixTimeNow } from '../helpers/time.js';
import { subscriptions, users } from '../../schema.js';
import { removeOrderWithoutSubscribers } from './subscriptions.js';

export async function ensureUser(telegramUserId, languageCode = DEFAULT_LOCALE) {
  await db.insert(users).values({ telegramUserId, languageCode })
    .onConflictDoNothing()
    .run();

  return getUserLocale(telegramUserId);
}

export async function setUserLocale(telegramUserId, languageCode) {
  await db.update(users)
    .set({ languageCode })
    .where(eq(users.telegramUserId, telegramUserId))
    .run();
}

export async function setUserRole(telegramUserId, role) {
  if (!Object.hasOwn(ROLE_LEVEL, role)) {
    throw new Error(`Unknown role: ${role}`);
  }

  await db.insert(users).values({ telegramUserId, role })
    .onConflictDoUpdate({
      target: users.telegramUserId,
      set: { role },
    })
    .run();
}

export async function getUserLocale(telegramUserId) {
  const user = await db.select({ languageCode: users.languageCode })
    .from(users)
    .where(eq(users.telegramUserId, telegramUserId))
    .get();

  return user?.languageCode ?? DEFAULT_LOCALE;
}

export async function getAdmins() {
  return db.select({
    telegramUserId: users.telegramUserId,
    languageCode: users.languageCode,
  }).from(users).where(eq(users.role, ROLE.ADMIN)).all();
}

export async function getUserRole(telegramUserId) {
  const user = await db.select({ role: users.role }).from(users)
    .where(eq(users.telegramUserId, telegramUserId))
    .get();

  return user?.role ?? ROLE.USER;
}

export async function claimStatusRefresh(telegramUserId, options = {}) {
  if (options.skipCooldown) {
    return 0;
  }

  return claimCooldown({
    telegramUserId,
    field: 'lastStatusRequestAt',
    cooldownMs: STATUS_REFRESH_COOLDOWN_MS,
  });
}

export async function claimSupportRequest(telegramUserId) {
  return claimCooldown({
    telegramUserId,
    field: 'lastSupportRequestAt',
    cooldownMs: SUPPORT_REQUEST_COOLDOWN_MS,
  });
}

export async function removeUser(telegramUserId) {
  const rows = await db.select().from(subscriptions)
    .where(eq(subscriptions.telegramUserId, telegramUserId))
    .all();

  await db.delete(subscriptions)
    .where(eq(subscriptions.telegramUserId, telegramUserId))
    .run();
  await db.delete(users)
    .where(eq(users.telegramUserId, telegramUserId))
    .run();

  for (const row of rows) {
    await removeOrderWithoutSubscribers(row.orderUid);
  }
}

async function claimCooldown(input) {
  const { telegramUserId, field, cooldownMs } = input;
  const now = unixTimeNow();
  const cooldownSeconds = millisecondsToSeconds(cooldownMs);
  const column = users[field];
  const result = await db.update(users)
    .set({ [field]: now })
    .where(and(
      eq(users.telegramUserId, telegramUserId),
      eq(users.role, ROLE.USER),
      or(isNull(column), lt(column, now - cooldownSeconds)),
    ))
    .run();

  if (result.rowsAffected) {
    return 0;
  }

  const user = await db.select().from(users)
    .where(eq(users.telegramUserId, telegramUserId))
    .get();

  if (user?.role === ROLE.ADMIN) {
    return 0;
  }

  const elapsed = now - (toUnixTime(user?.[field]) ?? 0);

  return Math.max(1, cooldownSeconds - elapsed);
}
