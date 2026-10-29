import { createCallbackData } from '../../core/callback-data.js';
import { CALLBACK_ACTION } from '../../core/constants.js';
import { logger } from '../../core/logger.js';
import { createI18n } from '../../i18n/index.js';
import {
  claimSupportRequest,
  getAdmins,
} from '../../repository/users.js';

export async function forwardSupportMessage(ctx, services) {
  const retryAfter = await claimSupportRequest(ctx.from.id);

  if (retryAfter) {
    await ctx.reply(ctx.i18n.t('support.retry', retryAfter));

    return;
  }

  let delivered = false;

  for (const admin of await getAdmins()) {
    try {
      const adminI18n = createI18n(admin.languageCode);
      const forwarded = await services.telegram.forwardMessage({
        chat_id: admin.telegramUserId,
        from_chat_id: ctx.chatId,
        message_id: ctx.messageId,
      });

      await services.telegram.sendMessage({
        chat_id: admin.telegramUserId,
        text: adminI18n.t('support.adminMessage'),
        reply_parameters: { message_id: forwarded.message_id },
        reply_markup: {
          inline_keyboard: [[{
            text: adminI18n.t('support.answer'),
            callback_data: createCallbackData(CALLBACK_ACTION.SUPPORT, ctx.from.id),
          }]],
        },
      });
      delivered = true;
    } catch (error) {
      logger.warn('support_message_send_failed', { code: error?.code });
    }
  }

  await ctx.reply(ctx.i18n.t(delivered ? 'support.sent' : 'support.unavailable'));
}
