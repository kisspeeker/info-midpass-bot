import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { once } from 'node:events';
import { clearTimeout, setTimeout } from 'node:timers';

import { maintenanceToken } from '../config.js';
import { HTTP_KEEP_ALIVE_TIMEOUT_MS, HTTP_REQUEST_TIMEOUT_MS, JOB_HOST, JOB_PORT } from '../constants.js';
import { logger } from './logger.js';

export async function run(bot, db, { shutdown, jobs, initialize }) {
  const stopped = once(shutdown.signal, 'abort');
  const stop = () => shutdown.abort();
  const authorization = Buffer.from(`Bearer ${maintenanceToken()}`);
  let ready = false;
  let polling;
  const healthy = () => ready && bot.isRunning() && !shutdown.signal.aborted;
  const server = createServer((request, response) => {
    handle(request, response).catch((error) => {
      logger.error('maintenance_failed', error);
      respond(response, 500, { error: 'maintenance_failed' });
    });
  });

  async function handle(request, response) {
    const url = new URL(request.url, `http://${JOB_HOST}:${JOB_PORT}`);

    if (request.method === 'GET' && url.pathname === '/health/live') {
      const ok = healthy();

      return respond(response, ok ? 200 : 503, { ok });
    }

    if (request.method !== 'POST' || url.pathname !== '/jobs/poll') {
      return respond(response, 404, { error: 'not_found' });
    }

    const provided = Buffer.from(request.headers.authorization ?? '');

    if (provided.length !== authorization.length || !timingSafeEqual(provided, authorization)) {
      return respond(response, 401, { error: 'unauthorized' });
    }

    if (!healthy()) {
      return respond(response, 503, { error: shutdown.signal.aborted ? 'shutting_down' : 'not_ready' });
    }

    const rawLimit = url.searchParams.get('limit');
    const limit = rawLimit === null ? undefined : Number(rawLimit);

    if (rawLimit !== null && (!/^[1-9]\d*$/.test(rawLimit) || !Number.isSafeInteger(limit))) {
      return respond(response, 400, { error: 'invalid_poll_limit' });
    }

    const result = await jobs.run({ limit });

    respond(response, result.done === false ? 500 : 200, result);
  }

  server.headersTimeout = HTTP_REQUEST_TIMEOUT_MS;
  server.requestTimeout = HTTP_REQUEST_TIMEOUT_MS;
  server.keepAliveTimeout = HTTP_KEEP_ALIVE_TIMEOUT_MS;
  server.on('error', (error) => {
    logger.error('server_failed', error);
    process.exitCode = 1;
    stop();
  });
  server.listen(JOB_PORT, JOB_HOST);

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, stop);
  }

  try {
    const webhook = await bot.api.getWebhookInfo(shutdown.signal);

    if (webhook.url) {
      throw new Error('Remove the existing webhook before starting long polling');
    }

    if (!shutdown.signal.aborted) {
      await bot.init(shutdown.signal);
      await initialize();
    }

    if (!shutdown.signal.aborted) {
      polling = bot.start({
        limit: 1,
        allowed_updates: ['message', 'callback_query'],
        onStart: () => {
          if (shutdown.signal.aborted) {
            return bot.stop();
          }

          ready = true;
          jobs.start();
          logger.info('bot_started');
        },
      }).catch((error) => {
        if (!shutdown.signal.aborted) {
          logger.error('polling_failed', error);
          process.exitCode = 1;
          stop();
        }
      });
      await stopped;
    }
  } catch (error) {
    if (!shutdown.signal.aborted) {
      logger.error('startup_failed', error);
      process.exitCode = 1;
    }
  } finally {
    stop();
    ready = false;

    const deadline = setTimeout(() => {
      logger.error('shutdown_timeout');
      db.close();
      process.exit(1);
    }, 50_000);

    deadline.unref();

    try {
      const drained = jobs.stop();
      const closed = new Promise((resolve) => server.close(resolve));

      server.closeIdleConnections();
      await bot.stop().catch(() => {});
      await Promise.allSettled([polling, drained, closed]);
    } finally {
      db.close();
      clearTimeout(deadline);
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
    }
  }
}

function respond(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}
