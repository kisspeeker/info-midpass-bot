import { MAINTENANCE_URL } from '../src/config.js';
import { HEALTH_TIMEOUT_MS } from '../src/constants.js';

try {
  const response = await fetch(`${MAINTENANCE_URL}/health/live`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
  const result = await response.json();

  process.exitCode = response.ok && result.ok === true ? 0 : 1;
} catch {
  process.exitCode = 1;
}
