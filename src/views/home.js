import { Composer, InlineKeyboard } from 'grammy';

import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import {
  CALLBACK_ACTION,
  CALLBACK_VALUE,
  COMMAND,
  PASSPORT_TYPE,
  ROLE,
} from '../config.js';
import { showMessage } from '../lib/telegram.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const home = new Composer();

home.command([COMMAND.START, COMMAND.MENU], showMainMenu);
home.callbackQuery(callbackPattern(CALLBACK_ACTION.MENU), showMainMenu);
home.on('message', showMainMenu);

export async function showMainMenu(ctx) {
  const text = ctx.i18n.t('menu.title');
  const extra = { reply_markup: await mainMenuKeyboard(ctx) };

  await showMessage({ ctx, text, extra });
}

export function mainMenuBackButton(ctx) {
  return InlineKeyboard.text(ctx.i18n.t('menu.back'), createCallbackData(CALLBACK_ACTION.MENU, CALLBACK_VALUE.OPEN));
}

export function mainMenuBackKeyboard(ctx) {
  return { reply_markup: InlineKeyboard.from([[mainMenuBackButton(ctx)]]) };
}

async function mainMenuKeyboard(ctx) {
  const keyboard = new InlineKeyboard()
    .text(ctx.i18n.passportLabel(PASSPORT_TYPE.LEGACY_TYPE), createCallbackData(CALLBACK_ACTION.PASSPORT, PASSPORT_TYPE.LEGACY_TYPE))
    .text(ctx.i18n.passportLabel(PASSPORT_TYPE.BIOMETRIC), createCallbackData(CALLBACK_ACTION.PASSPORT, PASSPORT_TYPE.BIOMETRIC)).row()
    .text(ctx.i18n.t('menu.subscriptions'), createCallbackData(CALLBACK_ACTION.SUBSCRIPTIONS, CALLBACK_VALUE.LIST))
    .text(ctx.i18n.t('menu.faq'), createCallbackData(CALLBACK_ACTION.FAQ, CALLBACK_VALUE.USAGE)).row()
    .text(ctx.i18n.t('menu.statuses'), createCallbackData(CALLBACK_ACTION.ABOUT, CALLBACK_VALUE.OPEN))
    .text(ctx.i18n.t('menu.language'), createCallbackData(CALLBACK_ACTION.LANGUAGE, CALLBACK_VALUE.SELECT));

  if (await ctx.services.users.hasRole(ctx.from.id, ROLE.ADMIN)) {
    keyboard.row().text(ctx.i18n.t('commands.admin'), createCallbackData(CALLBACK_ACTION.ADMIN, CALLBACK_VALUE.OPEN));
  }

  return keyboard;
}
