import { Composer } from 'grammy';

import { CALLBACK_ACTION, COMMAND, ROLE } from '../config.js';
import { callbackPattern } from '../lib/callback-data.js';
import { mainMenuBackKeyboard } from './home.js';
import { showMessage } from '../lib/telegram.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const admin = new Composer();

admin.command(COMMAND.ADMIN, showAdmin);
admin.callbackQuery(callbackPattern(CALLBACK_ACTION.ADMIN), showAdmin);

async function showAdmin(ctx, next) {
  if (!await ctx.services.users.hasRole(ctx.from.id, ROLE.ADMIN)) {
    return next();
  }

  const text = ctx.i18n.t('admin.stats', await ctx.services.maintenance.getStats());

  await showMessage({ ctx, text, extra: ctx.callbackQuery ? mainMenuBackKeyboard(ctx) : {} });
}
