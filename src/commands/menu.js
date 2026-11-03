import { Composer } from 'grammy';

import { LANGUAGE_NAMES, PASSPORT_TYPE, ROLE } from '../constants.js';

export const menu = new Composer();

export function showMenu(ctx) {
  const keyboard = ctx.keyboard();

  for (const type of Object.values(PASSPORT_TYPE)) {
    keyboard.text(ctx.i18n.passportLabel(type), `passport:${type}`);
  }

  keyboard.row()
    .text(ctx.t('commands.subscriptions'), 'subscriptions')
    .text(ctx.t('commands.faq'), 'faq').row()
    .text(ctx.t('commands.about'), 'about')
    .text(ctx.t('commands.language'), 'language').row();

  if (ctx.can(ROLE.ADMIN)) {
    keyboard.text(ctx.t('commands.admin'), 'admin').row();
  }

  return ctx.screen(ctx.t('menu.title'), keyboard);
}

function showLanguage(ctx) {
  const keyboard = ctx.keyboard();

  for (const [locale, name] of Object.entries(LANGUAGE_NAMES)) {
    keyboard.text(name, `language:${locale}`);
  }

  keyboard.row().text(ctx.t('menu.back'), 'menu');

  return ctx.screen(ctx.t('language.title'), keyboard);
}

menu.command(['start', 'menu'], showMenu);
menu.callbackQuery(['menu', 'menu:open', 'delete_account:cancel'], showMenu);
menu.callbackQuery(['language', 'language:select'], showLanguage);

for (const locale of Object.keys(LANGUAGE_NAMES)) {
  menu.callbackQuery(`language:${locale}`, async (ctx) => {
    await ctx.setLocale(locale);

    return showMenu(ctx);
  });
}
