import { Api } from 'grammy';

import { requireBotToken } from '../config.js';
import { TELEGRAM_TIMEOUT_SECONDS } from '../constants.js';

export const telegramClientOptions = { timeoutSeconds: TELEGRAM_TIMEOUT_SECONDS };

export function createTelegramApi({ api = new Api(requireBotToken(), telegramClientOptions), signal: defaultSignal } = {}) {

  api.config.use((prev, method, payload, signal) => {
    if (method === 'sendMessage' || method === 'editMessageText') {
      payload.link_preview_options ??= { is_disabled: true };
    }

    if (method === 'sendMessage') {
      payload.reply_markup ??= { remove_keyboard: true };
    }

    return prev(method, payload, signal ?? defaultSignal);
  });

  return api;
}
