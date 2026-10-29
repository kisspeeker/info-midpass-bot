import { createCallbackData } from '../../core/callback-data.js';
import {
  CALLBACK_ACTION,
  CALLBACK_VALUE,
  PASSPORT_TYPE,
} from '../../core/constants.js';
import { ROLE, filterByRole } from '../access.js';

export const menuMessageRoutes = [{
  match: () => true,
  handle: showMainMenu,
}];

export const menuCallbackRoutes = [{
  action: CALLBACK_ACTION.MENU,
  handle: showMainMenu,
}];

export async function showMainMenu(ctx) {
  const text = ctx.i18n.t('menu.title');
  const extra = { reply_markup: { inline_keyboard: await mainMenuKeyboard(ctx) } };

  if (ctx.isCallback) {
    await ctx.edit(text, extra);

    return;
  }

  await ctx.reply(text, extra);
}

export function mainMenuBackButton(ctx) {
  return {
    text: `‹ ${ctx.i18n.t('menu.back')}`,
    callback_data: createCallbackData(CALLBACK_ACTION.MENU, CALLBACK_VALUE.OPEN),
  };
}

export function mainMenuBackKeyboard(ctx) {
  return {
    reply_markup: {
      inline_keyboard: [[mainMenuBackButton(ctx)]],
    },
  };
}

async function mainMenuKeyboard(ctx) {
  const rows = [[
    {
      text: ctx.i18n.passportLabel(PASSPORT_TYPE.LEGACY_TYPE),
      callback_data: createCallbackData(CALLBACK_ACTION.PASSPORT, PASSPORT_TYPE.LEGACY_TYPE),
    },
    {
      text: ctx.i18n.passportLabel(PASSPORT_TYPE.BIOMETRIC),
      callback_data: createCallbackData(CALLBACK_ACTION.PASSPORT, PASSPORT_TYPE.BIOMETRIC),
    },
  ], [
    {
      text: ctx.i18n.t('menu.subscriptions'),
      callback_data: createCallbackData(CALLBACK_ACTION.SUBSCRIPTIONS, CALLBACK_VALUE.LIST),
    },
    {
      text: ctx.i18n.t('menu.faq'),
      callback_data: createCallbackData(CALLBACK_ACTION.FAQ, CALLBACK_VALUE.USAGE),
    },
  ], [
    {
      text: ctx.i18n.t('menu.statuses'),
      callback_data: createCallbackData(CALLBACK_ACTION.FAQ, CALLBACK_VALUE.STATUSES),
    },
    {
      text: ctx.i18n.t('menu.language'),
      callback_data: createCallbackData(CALLBACK_ACTION.LANGUAGE, CALLBACK_VALUE.SELECT),
    },
  ]];

  const adminItems = await filterByRole(ctx, [{
    role: ROLE.ADMIN,
    button: {
      text: ctx.i18n.t('commands.admin'),
      callback_data: createCallbackData(CALLBACK_ACTION.ADMIN, CALLBACK_VALUE.OPEN),
    },
  }]);

  if (adminItems.length) {
    rows.push(adminItems.map((item) => item.button));
  }

  return rows;
}
