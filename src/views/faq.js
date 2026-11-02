import { Composer, InlineKeyboard } from 'grammy';

import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../config.js';
import { mainMenuBackButton } from './home.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const faq = new Composer();

faq.callbackQuery(callbackPattern(CALLBACK_ACTION.FAQ), showFaq);

async function showFaq(ctx) {
  await ctx.editMessageText(ctx.i18n.t('faq.usage'), {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard()
      .text(ctx.i18n.t('cryptoDonation.open'), createCallbackData(CALLBACK_ACTION.CRYPTO_DONATION, `faq:${CALLBACK_VALUE.USAGE}`)).row()
      .add(mainMenuBackButton(ctx)),
  });
}
