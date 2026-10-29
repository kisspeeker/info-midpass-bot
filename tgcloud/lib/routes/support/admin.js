import { logger } from '../../core/logger.js';
import { isTranslation } from '../../i18n/index.js';

export async function requestSupportReply(ctx, telegramUserId) {
  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    await ctx.alert(ctx.i18n.t('support.actionUnavailable'));

    return;
  }

  await ctx.reply(ctx.i18n.t('support.replyPrompt', telegramUserId), {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: ctx.i18n.t('support.replyPlaceholder'),
    },
  });
}

export function getSupportReplyTarget(prompt) {
  const match = String(prompt).match(/(\d+):$/);
  const telegramUserId = Number(match?.[1]);

  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) {
    return null;
  }

  return isTranslation(prompt, 'support.replyPrompt', telegramUserId)
    ? telegramUserId
    : null;
}

export async function forwardSupportReply(ctx, input) {
  const { telegramUserId, services } = input;

  try {
    await services.telegram.copyMessage({
      chat_id: telegramUserId,
      from_chat_id: ctx.chatId,
      message_id: ctx.messageId,
    });
    await ctx.reply(ctx.i18n.t('support.replySent'));
  } catch (error) {
    logger.warn('support_reply_send_failed', { code: error?.code });
    await ctx.reply(ctx.i18n.t('support.replyFailed'));
  }
}
