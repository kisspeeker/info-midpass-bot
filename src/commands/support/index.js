import { Composer, InlineKeyboard } from 'grammy';
import { createConversation } from '@grammyjs/conversations';

import { ROLE } from '../../constants.js';
import { createI18n } from '../../i18n/index.js';
import { logger } from '../../services/logger.js';

export const support = new Composer();

async function supportRequest(conversation, ctx, locale) {
  const i18n = createI18n(locale);
  const keyboard = new InlineKeyboard().text(i18n.t('menu.back'), 'menu');

  await ctx.reply(i18n.t('support.prompt'), { reply_markup: keyboard });

  const answer = await conversation.waitFor('message');
  const retryAfter = await conversation.external((ctx) => ctx.services.users.claimSupportRequest(ctx.from.id));

  if (retryAfter) {
    await answer.reply(i18n.t('support.retry', retryAfter));

    return;
  }

  const admins = await conversation.external((ctx) => ctx.services.users.admins());
  let delivered = false;

  for (const admin of admins) {
    try {
      const forwarded = await answer.forwardMessage(admin.telegramUserId);
      const adminI18n = createI18n(admin.languageCode);

      await answer.api.sendMessage(admin.telegramUserId, adminI18n.t('support.adminMessage'), {
        reply_parameters: { message_id: forwarded.message_id },
        reply_markup: new InlineKeyboard().text(adminI18n.t('support.answer'), `support:${answer.from.id}`),
      });
      delivered = true;
    } catch (error) {
      await conversation.external(() => logger.error('support_message_send_failed', error));
    }
  }

  await answer.reply(i18n.t(delivered ? 'support.sent' : 'support.unavailable'));
}

async function supportReply(conversation, ctx, { recipient, locale }) {
  const i18n = createI18n(locale);
  const allowed = await conversation.external((ctx) => ctx.can(ROLE.ADMIN));

  if (!allowed) {
    await ctx.reply(i18n.t('forbidden'));

    return;
  }

  const keyboard = new InlineKeyboard().text(i18n.t('menu.back'), 'admin');

  await ctx.reply(i18n.t('support.replyPrompt', recipient), { reply_markup: keyboard });

  const answer = await conversation.waitFor('message');
  const stillAllowed = await conversation.external((ctx) => ctx.can(ROLE.ADMIN));

  if (!stillAllowed) {
    await answer.reply(i18n.t('forbidden'));

    return;
  }

  try {
    await answer.copyMessage(recipient);
    await answer.reply(i18n.t('support.replySent'));
  } catch (error) {
    await conversation.external(() => logger.error('support_reply_send_failed', error));
    await answer.reply(i18n.t('support.replyFailed'));
  }
}

export function requestSupportReply(ctx) {
  if (!ctx.can(ROLE.ADMIN)) {
    return ctx.reply(ctx.t('forbidden'));
  }

  const recipient = Number(ctx.match[1]);

  if (!Number.isSafeInteger(recipient) || recipient <= 0) {
    return ctx.reply(ctx.t('support.actionUnavailable'));
  }

  return ctx.conversation.enter('supportReply', { recipient, locale: ctx.i18n.locale });
}

export function showSupport(ctx) {
  return ctx.conversation.enter('supportRequest', ctx.i18n.locale);
}

support.use(createConversation(supportRequest), createConversation(supportReply));
support.command('support', showSupport);
support.callbackQuery('support', showSupport);
support.callbackQuery(/^support:([1-9]\d*)$/, requestSupportReply);
