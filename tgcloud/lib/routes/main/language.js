import { createCallbackData } from '../../core/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../../core/constants.js';
import { createI18n, LOCALES } from '../../i18n/index.js';
import { setUserLocale } from '../../repository/users.js';
import { mainMenuBackButton, showMainMenu } from './menu.js';

export const languageCallbackRoutes = [{
  action: CALLBACK_ACTION.LANGUAGE,
  handle: selectLanguage,
}];

async function selectLanguage(ctx, route) {
  if (route.value === CALLBACK_VALUE.SELECT) {
    await showLanguageSelector(ctx);

    return;
  }

  if (!Object.hasOwn(LOCALES, route.value)) {
    await showMainMenu(ctx);

    return;
  }

  await setUserLocale(ctx.from.id, route.value);
  ctx.i18n = createI18n(route.value);
  await showMainMenu(ctx);
}

async function showLanguageSelector(ctx) {
  await ctx.edit(ctx.i18n.t('language.title'), {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Русский',
          callback_data: createCallbackData(CALLBACK_ACTION.LANGUAGE, CALLBACK_VALUE.RU),
        },
        {
          text: 'English',
          callback_data: createCallbackData(CALLBACK_ACTION.LANGUAGE, CALLBACK_VALUE.EN),
        },
      ], [mainMenuBackButton(ctx)]],
    },
  });
}
