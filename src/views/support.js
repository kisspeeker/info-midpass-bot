import { Composer, InlineKeyboard } from 'grammy';

import { CALLBACK_ACTION, COMMAND, ROLE } from '../config.js';
import { createI18n, isTranslation, isSupportPrompt } from '../i18n/index.js';
import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import { logger } from '../lib/logger.js';
import { botReplyText } from '../lib/telegram.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const support = new Composer();

support.command(COMMAND.SUPPORT, requestSupport);
support.on('message', handleSupportMessage);
support.callbackQuery(callbackPattern(CALLBACK_ACTION.SUPPORT), requestSupportReply);

async function handleSupportMessage(ctx, next) {
  const prompt = botReplyText(ctx);
  const recipient = getSupportReplyTarget(prompt);

  if (recipient && await ctx.services.users.hasRole(ctx.from.id, ROLE.ADMIN)) {
    return forwardSupportReply(ctx, recipient);
  }

  return isSupportPrompt(prompt) ? forwardSupportMessage(ctx) : next();
}

function requestSupport(ctx) {
  return ctx.reply(ctx.i18n.t('support.prompt'), {
    reply_markup: { force_reply: true },
  });
}


async function requestSupportReply(ctx, next) {
  if (!await ctx.services.users.hasRole(ctx.from.id, ROLE.ADMIN)) {
    return next();
  }

  const id = Number(ctx.match[1]);

  if (!Number.isSafeInteger(id) || id <= 0) {
    await ctx.answerCallbackQuery({ text: ctx.i18n.t('support.actionUnavailable'), show_alert: true });

    return;
  }

  await ctx.reply(ctx.i18n.t('support.replyPrompt', id), {
    reply_markup: { force_reply: true, input_field_placeholder: ctx.i18n.t('support.replyPlaceholder') },
  });
}

function getSupportReplyTarget(prompt) {
  const id = Number(String(prompt).match(/(\d+):$/)?.[1]);

  return Number.isSafeInteger(id) && id > 0 && isTranslation(prompt, 'support.replyPrompt', id) ? id : null;
}

async function forwardSupportReply(ctx, recipient) {
  try {
    await ctx.copyMessage(recipient);
    await ctx.reply(ctx.i18n.t('support.replySent'));
  } catch (error) {
    logger.error('support_reply_send_failed', error);
    await ctx.reply(ctx.i18n.t('support.replyFailed'));
  }
}

async function forwardSupportMessage(ctx) {
  const result = await ctx.services.support.request(ctx.from.id);

  if (result.status === 'retry') {
    await ctx.reply(ctx.i18n.t('support.retry', result.retryAfter));

    return;
  }

  let delivered = false;

  for (const admin of result.admins) {
    try {
      const forwarded = await ctx.forwardMessage(admin.telegramUserId);
      const i18n = createI18n(admin.languageCode);

      await ctx.api.sendMessage(admin.telegramUserId, i18n.t('support.adminMessage'), {
        reply_parameters: { message_id: forwarded.message_id },
        reply_markup: new InlineKeyboard().text(
          i18n.t('support.answer'),
          createCallbackData(CALLBACK_ACTION.SUPPORT, ctx.from.id),
        ),
      });
      delivered = true;
    } catch (error) {
      logger.error('support_message_send_failed', error);
    }
  }

  await ctx.reply(ctx.i18n.t(delivered ? 'support.sent' : 'support.unavailable'));
}
