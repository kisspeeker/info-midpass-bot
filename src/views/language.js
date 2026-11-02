import { Composer, InlineKeyboard } from 'grammy';

import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../config.js';
import { LANGUAGE_NAMES } from '../i18n/constants.js';
import { createI18n, LOCALES } from '../i18n/index.js';
import { mainMenuBackButton, showMainMenu } from './home.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const language = new Composer();

language.callbackQuery(callbackPattern(CALLBACK_ACTION.LANGUAGE), selectLanguage);

async function selectLanguage(ctx) {
  if (ctx.match[1] === CALLBACK_VALUE.SELECT) {
    await showLanguageSelector(ctx);

    return;
  }

  if (!Object.hasOwn(LOCALES, ctx.match[1])) {
    await showMainMenu(ctx);

    return;
  }

  await ctx.services.users.setLocale(ctx.from.id, ctx.match[1]);
  ctx.i18n = createI18n(ctx.match[1]);
  await ctx.syncCommands();
  await showMainMenu(ctx);
}

async function showLanguageSelector(ctx) {
  const keyboard = new InlineKeyboard();

  for (const [locale, label] of Object.entries(LANGUAGE_NAMES)) {
    keyboard.text(label, createCallbackData(CALLBACK_ACTION.LANGUAGE, locale));
  }

  keyboard.row().add(mainMenuBackButton(ctx));
  await ctx.editMessageText(ctx.i18n.t('language.title'), { reply_markup: keyboard });
}
