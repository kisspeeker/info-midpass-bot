import { CALLBACK_ACTION } from '../../core/constants.js';
import { getDatabaseStats } from '../../repository/bot-data.js';
import { ROLE } from '../access.js';
import { mainMenuBackKeyboard } from './menu.js';

export const adminMessageRoutes = [{
  match: (ctx) => ctx.text.split('@')[0] === '/admin',
  handle: showAdmin,
  role: ROLE.ADMIN,
}];

export const adminCallbackRoutes = [{
  action: CALLBACK_ACTION.ADMIN,
  handle: showAdmin,
  role: ROLE.ADMIN,
}];

async function showAdmin(ctx) {
  const text = ctx.i18n.t('admin.stats', await getDatabaseStats());

  if (ctx.isCallback) {
    await ctx.edit(text, mainMenuBackKeyboard(ctx));

    return;
  }

  await ctx.reply(text);
}
