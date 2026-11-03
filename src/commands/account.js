import { Composer } from 'grammy';

import { logger } from '../services/logger.js';

export const account = new Composer();

export function showAccount(ctx) {
  const keyboard = ctx.keyboard()
    .text(ctx.t('account.deleteConfirm'), 'delete_account:confirm')
    .text(ctx.t('account.deleteCancel'), 'menu');

  return ctx.screen(ctx.t('account.deletePrompt'), keyboard);
}

account.command('delete', showAccount);
account.callbackQuery('account', showAccount);
account.callbackQuery('delete_account:confirm', async (ctx) => {
  ctx.services.users.remove(ctx.from.id);

  try {
    await ctx.api.deleteMyCommands({ scope: { type: 'chat', chat_id: ctx.chatId } });
  } catch (error) {
    logger.error('account_commands_reset_failed', error);
  }

  return ctx.screen(ctx.t('account.deleted'));
});
