import { Composer, InlineKeyboard } from 'grammy';

import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../config.js';
import { mainMenuBackButton } from './home.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const about = new Composer();

about.callbackQuery(callbackPattern(CALLBACK_ACTION.ABOUT), showAbout);
about.callbackQuery(createCallbackData(CALLBACK_ACTION.FAQ, CALLBACK_VALUE.STATUSES), showAbout);

async function showAbout(ctx) {
  await ctx.editMessageText(ctx.i18n.t('about.text'), {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().add(mainMenuBackButton(ctx)),
  });
}
