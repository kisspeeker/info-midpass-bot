import { releasePollingLock, tryLockPolling } from '../../repository/polling-lock.js';
import { logger } from '../../core/logger.js';
import { runPolling } from './runner.js';

export default async function pollPassports() {
  const lockToken = `${Date.now()}-${Math.random()}`;

  if (!await tryLockPolling(lockToken)) {
    const summary = { skipped: true, reason: 'already-running' };

    logger.warn('passport_polling_skipped', summary);

    return summary;
  }

  try {
    return await runPolling(lockToken);
  } finally {
    await releasePollingLock(lockToken);
  }
}
