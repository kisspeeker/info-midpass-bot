import { parseArgs } from 'node:util';

import { MAINTENANCE_URL, POLL_TIMEOUT_MS, maintenanceToken } from '../src/config.js';
import { logger } from '../src/lib/logger.js';

try {
  const { values } = parseArgs({ options: { limit: { type: 'string' } } });
  const url = new URL('/jobs/poll', MAINTENANCE_URL);

  if (values.limit !== undefined) {
    url.searchParams.set('limit', values.limit);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${maintenanceToken()}` },
    signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
  });
  const result = await response.json();

  console.log(JSON.stringify(result));

  if (!response.ok || result.summary?.failed > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  logger.error('poll_request_failed', error);
  process.exitCode = 1;
}
