import { db } from 'sdk';
import { and, eq, lt } from 'sdk/db';

import { POLL_LOCK_NAME, POLL_LOCK_TTL_MS } from '../core/constants.js';
import { millisecondsToSeconds, unixTimeNow } from '../helpers/time.js';
import { pollLocks } from '../../schema.js';

export async function tryLockPolling(token) {
  const now = unixTimeNow();
  const lockTtl = millisecondsToSeconds(POLL_LOCK_TTL_MS);

  await db.insert(pollLocks).values({ name: POLL_LOCK_NAME }).onConflictDoNothing().run();

  const result = await db.update(pollLocks)
    .set({ token, lockedUntil: now + lockTtl })
    .where(and(
      eq(pollLocks.name, POLL_LOCK_NAME),
      lt(pollLocks.lockedUntil, now),
    ))
    .run();

  return result.rowsAffected === 1;
}

export async function releasePollingLock(token) {
  await db.update(pollLocks)
    .set({ token: null, lockedUntil: 0 })
    .where(and(eq(pollLocks.name, POLL_LOCK_NAME), eq(pollLocks.token, token)))
    .run();
}

export async function renewPollingLock(token) {
  const result = await db.update(pollLocks)
    .set({ lockedUntil: unixTimeNow() + millisecondsToSeconds(POLL_LOCK_TTL_MS) })
    .where(and(eq(pollLocks.name, POLL_LOCK_NAME), eq(pollLocks.token, token)))
    .run();

  if (result.rowsAffected !== 1) {
    throw new Error('Polling lock lost');
  }
}
