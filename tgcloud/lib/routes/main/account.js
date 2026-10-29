import { createCallbackData } from '../../core/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../../core/constants.js';
import { removeUser } from '../../repository/users.js';
import { showMainMenu } from './menu.js';

export const accountMessageRoutes = [{
  match: (ctx) => ctx.text.split('@')[0] === '/delete',
  handle: requestAccountDeletion,
}];

export const accountCallbackRoutes = [{
  action: CALLBACK_ACTION.DELETE_ACCOUNT,
  handle: deleteAccount,
}];

async function requestAccountDeletion(ctx) {
  await ctx.reply(ctx.i18n.t('account.deletePrompt'), {
    reply_markup: {
      inline_keyboard: [[
        {
          text: ctx.i18n.t('account.deleteConfirm'),
          callback_data: createCallbackData(
            CALLBACK_ACTION.DELETE_ACCOUNT,
            CALLBACK_VALUE.CONFIRM,
          ),
        },
        {
          text: ctx.i18n.t('account.deleteCancel'),
          callback_data: createCallbackData(
            CALLBACK_ACTION.DELETE_ACCOUNT,
            CALLBACK_VALUE.CANCEL,
          ),
        },
      ]],
    },
  });
}

async function deleteAccount(ctx, route) {
  if (route.value !== CALLBACK_VALUE.CONFIRM) {
    await showMainMenu(ctx);

    return;
  }

  await removeUser(ctx.from.id);
  await route.services.telegram.deleteChatCommands(ctx.chatId);
  await ctx.alert(ctx.i18n.t('account.deleted'));
  await ctx.edit(ctx.i18n.t('account.deleted'));
}
