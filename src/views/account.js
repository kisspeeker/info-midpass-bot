import { Composer, InlineKeyboard } from 'grammy';

import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE, COMMAND } from '../config.js';
import { logger } from '../lib/logger.js';
import { showMainMenu } from './home.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const account = new Composer();

account.command(COMMAND.DELETE, requestAccountDeletion);
account.callbackQuery(callbackPattern(CALLBACK_ACTION.DELETE_ACCOUNT), deleteAccount);

async function requestAccountDeletion(ctx) {
  await ctx.reply(ctx.i18n.t('account.deletePrompt'), {
    reply_markup: new InlineKeyboard()
      .text(ctx.i18n.t('account.deleteConfirm'), createCallbackData(CALLBACK_ACTION.DELETE_ACCOUNT, CALLBACK_VALUE.CONFIRM))
      .text(ctx.i18n.t('account.deleteCancel'), createCallbackData(CALLBACK_ACTION.DELETE_ACCOUNT, CALLBACK_VALUE.CANCEL)),
  });
}

async function deleteAccount(ctx) {
  if (ctx.match[1] !== CALLBACK_VALUE.CONFIRM) {
    await showMainMenu(ctx);

    return;
  }

  await ctx.services.users.remove(ctx.from.id);
  try {
    await ctx.api.deleteMyCommands({ scope: { type: 'chat', chat_id: ctx.chatId } });
  } catch (error) {
    logger.error('account_commands_reset_failed', error);
  }

  await ctx.answerCallbackQuery({ text: ctx.i18n.t('account.deleted'), show_alert: true });
  await ctx.editMessageText(ctx.i18n.t('account.deleted'));
}
