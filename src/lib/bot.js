import { Bot, GrammyError } from 'grammy';

import { requireBotToken, shutdown } from '../config.js';
import { logger } from './logger.js';
import { createTelegramApi, telegramClientOptions } from '../api/telegram.js';

export function createBot(app) {
  const bot = new Bot(requireBotToken(), { client: telegramClientOptions });

  createTelegramApi({ api: bot.api });
  bot.use(...app.middlewares);
  bot.use(...Object.values(app.views));
  bot.catch((error) => {
    if (shutdown.signal.aborted) {
      return;
    }

    if (error.error instanceof GrammyError && error.error.error_code === 400 && error.error.description.includes('message is not modified')) {
      return;
    }

    logger.error('telegram_update_failed', error.error, { updateId: error.ctx.update.update_id });
  });

  return bot;
}
