import { createCallbackData } from '../../core/callback-data.js';
import {
  CALLBACK_ACTION,
  CALLBACK_VALUE,
  CRYPTO_WALLETS,
} from '../../core/constants.js';
import { mainMenuBackButton } from './menu.js';

export const cryptoMessageRoutes = [{
  match: (ctx) => ctx.text.split('@')[0] === '/crypto',
  handle: showCrypto,
}];

export const cryptoCallbackRoutes = [{
  action: CALLBACK_ACTION.CRYPTO,
  handle: showCrypto,
}];

async function showCrypto(ctx, route = {}) {
  const openInNewMessage = ctx.isCallback && route.value === CALLBACK_VALUE.NEW;
  const faqSource = route.value?.startsWith('faq:')
    ? route.value.slice(4)
    : route.value === CALLBACK_VALUE.OPEN ? CALLBACK_VALUE.USAGE : null;
  const navigationButton = openInNewMessage
    ? mainMenuBackButton(ctx)
    : faqSource
    ? {
      text: `‹ ${ctx.i18n.t('menu.back')}`,
      callback_data: createCallbackData(CALLBACK_ACTION.FAQ, faqSource),
    }
    : ctx.isCallback
    ? {
      text: `‹ ${ctx.i18n.t('menu.back')}`,
      callback_data: createCallbackData(CALLBACK_ACTION.STATUS, route.value),
    }
    : mainMenuBackButton(ctx);
  const text = ctx.i18n.t('crypto.text', CRYPTO_WALLETS);
  const extra = {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...Object.entries(CRYPTO_WALLETS).map(([symbol, wallet]) => [{
          text: ctx.i18n.t('crypto.copy', symbol),
          copy_text: { text: wallet.address },
        }]),
        [navigationButton],
      ],
    },
  };

  if (openInNewMessage) {
    await ctx.answer();
    await ctx.reply(text, extra);

    return;
  }

  if (ctx.isCallback) {
    await ctx.edit(text, extra);

    return;
  }

  await ctx.reply(text, extra);
}
