import { Composer } from 'grammy';

import { ROLE } from '../constants.js';

export const admin = new Composer();

export function showAdmin(ctx) {
  if (!ctx.can(ROLE.ADMIN)) {
    return ctx.reply(ctx.t('forbidden'));
  }

  const keyboard = ctx.keyboard().text(ctx.t('menu.back'), 'menu');

  return ctx.screen(ctx.t('admin.stats', ctx.services.maintenance.getStats()), keyboard);
}

admin.command('admin', showAdmin);
admin.callbackQuery(['admin', 'admin:open'], showAdmin);
