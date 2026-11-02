import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { HTTPException } from 'hono/http-exception';

import { maintenanceToken, shutdown } from '../config.js';
import { logger } from '../lib/logger.js';

export function createMaintenanceApp({ jobs, isReady }) {
  const app = new Hono();
  const healthy = () => isReady() && !shutdown.signal.aborted;

  app.get('/health/live', (c) => {
    const ok = healthy();

    return c.json({ ok }, ok ? 200 : 503);
  });
  app.use('/jobs/*', bearerAuth({ token: maintenanceToken() }));
  app.use('/jobs/*', async (c, next) => {
    if (!healthy()) {
      return c.json({ error: shutdown.signal.aborted ? 'shutting_down' : 'not_ready' }, 503);
    }

    await next();
  });
  app.post('/jobs/poll', async (c) => {
    const rawLimit = c.req.query('limit');
    const limit = rawLimit === undefined ? undefined : Number(rawLimit);

    if (rawLimit !== undefined && (!/^[1-9]\d*$/.test(rawLimit) || !Number.isSafeInteger(limit))) {
      return c.json({ error: 'invalid_poll_limit' }, 400);
    }

    const result = await jobs.run({ limit });

    return c.json(result, result.done === false ? 500 : 200);
  });
  app.notFound((c) => c.json({ error: 'not_found' }, 404));
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    logger.error('maintenance_failed', error);

    return c.json({ error: 'maintenance_failed' }, 500);
  });

  return app;
}
