import { BotApiError } from 'sdk';

import { createChatContext } from '../../core/context.js';
import { logger } from '../../core/logger.js';
import { telegram } from '../../core/telegram.js';
import { createI18n } from '../../i18n/index.js';
import { getAdmins, getUserLocale, removeUser } from '../../repository/users.js';
import { sendPassportStatus } from '../status/index.js';

export async function notifyAdmins(summary) {
  for (const admin of await getAdmins()) {
    try {
      const i18n = createI18n(admin.languageCode);

      await telegram.sendMessage({
        chat_id: admin.telegramUserId,
        text: i18n.t('polling.summary', summary),
      });
    } catch (error) {
      logger.warn('passport_polling_summary_send_failed', { code: error?.code });
    }
  }
}

export async function notifySubscriber(input) {
  const {
    telegramUserId,
    order,
    summary,
    i18nByUser,
  } = input;

  try {
    let i18n = i18nByUser.get(telegramUserId);

    if (!i18n) {
      i18n = createI18n(await getUserLocale(telegramUserId));
      i18nByUser.set(telegramUserId, i18n);
    }

    const ctx = createChatContext(telegramUserId, i18n);

    await sendPassportStatus(ctx, {
      notification: true,
      order,
      prefix: i18n.t('passport.changed'),
      suffix: i18n.t('donations.text'),
    });
    summary.notified += 1;
  } catch (error) {
    if (error instanceof BotApiError && error.code === 403) {
      await removeUser(telegramUserId);

      return;
    }

    logger.error('passport_subscriber_notify_failed', error, {
      type: order.type,
      uid: order.uid,
      code: error?.code,
    });
  }
}
