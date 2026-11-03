import { Composer, InlineKeyboard } from 'grammy';

import { CRYPTO_WALLETS } from '../constants.js';

export const cryptoDonation = new Composer();

export function showCryptoDonation(ctx, reply = false) {
  const keyboard = ctx.keyboard();

  for (const [symbol, wallet] of Object.entries(CRYPTO_WALLETS)) {
    keyboard.add(InlineKeyboard.copyText(ctx.t('cryptoDonation.copy', symbol), wallet.address)).row();
  }

  keyboard.text(ctx.t('menu.back'), 'menu');

  const text = ctx.t('cryptoDonation.text', CRYPTO_WALLETS);

  return reply
    ? ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
    : ctx.screen(text, keyboard, { parse_mode: 'HTML' });
}

cryptoDonation.command('crypto', (ctx) => showCryptoDonation(ctx));
cryptoDonation.callbackQuery('crypto', (ctx) => showCryptoDonation(ctx));
cryptoDonation.callbackQuery('crypto:new', (ctx) => showCryptoDonation(ctx, true));
cryptoDonation.callbackQuery(/^crypto:(?!new$).+$/, (ctx) => showCryptoDonation(ctx));
