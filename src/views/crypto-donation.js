import { Composer, InlineKeyboard } from 'grammy';

import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import {
  CALLBACK_ACTION,
  CALLBACK_VALUE,
  COMMAND,
  CRYPTO_WALLETS,
} from '../config.js';
import { mainMenuBackButton } from './home.js';
import { showMessage } from '../lib/telegram.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const cryptoDonation = new Composer();

cryptoDonation.command(COMMAND.CRYPTO_DONATION, showCryptoDonation);
cryptoDonation.callbackQuery(callbackPattern(CALLBACK_ACTION.CRYPTO_DONATION), showCryptoDonation);

async function showCryptoDonation(ctx) {
  const source = ctx.callbackQuery ? ctx.match[1] : undefined;
  const openInNewMessage = ctx.callbackQuery && source === CALLBACK_VALUE.NEW;
  const navigationButton = createCryptoDonationNavigationButton(ctx, source);

  const text = ctx.i18n.t('cryptoDonation.text', CRYPTO_WALLETS);
  const extra = {
    parse_mode: 'HTML',
    reply_markup: InlineKeyboard.from([
      ...Object.entries(CRYPTO_WALLETS).map(([symbol, wallet]) => [InlineKeyboard.copyText(ctx.i18n.t('cryptoDonation.copy', symbol), wallet.address)]),
      [navigationButton],
    ]),
  };

  if (openInNewMessage) {
    await ctx.answerCallbackQuery();
    await ctx.reply(text, extra);

    return;
  }

  await showMessage({ ctx, text, extra });
}

function createCryptoDonationNavigationButton(ctx, source) {
  if (!ctx.callbackQuery || source === CALLBACK_VALUE.NEW) {
    return mainMenuBackButton(ctx);
  }

  const faqSource = getFaqSource(source);

  if (faqSource) {
    return backButton({ ctx, action: CALLBACK_ACTION.FAQ, value: faqSource });
  }

  return backButton({ ctx, action: CALLBACK_ACTION.STATUS, value: source });
}

function getFaqSource(source) {
  if (source?.startsWith('faq:')) {
    return source.slice(4);
  }

  return source === CALLBACK_VALUE.OPEN ? CALLBACK_VALUE.USAGE : null;
}

function backButton({ ctx, action, value }) {
  return InlineKeyboard.text(ctx.i18n.t('menu.back'), createCallbackData(action, value));
}
