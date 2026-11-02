import { Cron } from 'croner';
import PQueue from 'p-queue';

import { POLL_SCHEDULES, TIME_ZONE } from './config.js';
import { logger } from './lib/logger.js';

export function createJobs({ polling }) {
  const execution = new PQueue({ concurrency: 1 });
  let stopping = false;
  const schedules = POLL_SCHEDULES.map((cron) => new Cron(cron, {
    timezone: TIME_ZONE,
    paused: true,
    catch: (error) => logger.error('scheduled_poll_failed', error),
  }, () => run()));

  function run(input = {}) {
    if (stopping || execution.size || execution.pending) {
      return Promise.resolve({ skipped: true, reason: stopping ? 'shutting-down' : 'already-running' });
    }

    return execution.add(() => polling.run(input));
  }

  return {
    run,
    start: () => schedules.forEach((schedule) => schedule.resume()),
    async stop() {
      stopping = true;
      schedules.forEach((schedule) => schedule.stop());
      await execution.onIdle();
    },
  };
}
