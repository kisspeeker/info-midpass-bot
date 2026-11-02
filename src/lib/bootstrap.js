import { serve } from '@hono/node-server';
import { once } from 'node:events';

import { HTTP_KEEP_ALIVE_TIMEOUT_MS, HTTP_REQUEST_TIMEOUT_MS, JOB_HOST, JOB_PORT, shutdown } from '../config.js';
import { logger } from './logger.js';
import { createBot } from './bot.js';
import { createMaintenanceApp } from '../api/maintenance.js';

export async function bootstrap(appConfig) {
  const bot = createBot(appConfig);
  const jobs = appConfig.jobs;
  const stop = () => shutdown.abort();
  const stopped = once(shutdown.signal, 'abort');
  let ready = false;
  const app = createMaintenanceApp({ jobs, isReady: () => ready && bot.isRunning() });

  const server = serve({ fetch: app.fetch, port: JOB_PORT, hostname: JOB_HOST });
  let polling;

  server.headersTimeout = HTTP_REQUEST_TIMEOUT_MS;
  server.requestTimeout = HTTP_REQUEST_TIMEOUT_MS;
  server.keepAliveTimeout = HTTP_KEEP_ALIVE_TIMEOUT_MS;
  server.on('error', (error) => {
    logger.error('maintenance_server_failed', error);
    process.exitCode = 1;
    stop();
  });

  for (const event of ['SIGINT', 'SIGTERM']) {
    process.once(event, stop);
  }

  try {
    const webhook = await bot.api.getWebhookInfo(shutdown.signal);

    if (webhook.url) {
      throw new Error('Remove the Telegram webhook before starting the bot');
    }

    await bot.init(shutdown.signal);
    await appConfig.initialize();

    if (!shutdown.signal.aborted) {
      polling = bot.start({
        limit: 1,
        allowed_updates: ['message', 'callback_query'],
        onStart: () => {
          if (shutdown.signal.aborted) {
            return bot.stop();
          }

          jobs.start();
          ready = true;
          logger.info('bot_started');
        },
      }).catch((error) => {
        if (!shutdown.signal.aborted) {
          logger.error('bot_failed', error);
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
    ready = false;
    stop();

    const drained = jobs.stop();
    const closed = new Promise((resolve) => server.close(resolve));

    server.closeIdleConnections();

    if (bot.isRunning()) {
      await bot.stop().catch((error) => logger.error('bot_stop_failed', error));
    }

    await Promise.allSettled([polling, drained, closed]);
    appConfig.close();

    for (const event of ['SIGINT', 'SIGTERM']) {
      process.removeListener(event, stop);
    }
  }
}
