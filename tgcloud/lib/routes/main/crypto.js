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
  const navigationButton = createCryptoNavigationButton(ctx, route.value);

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

function createCryptoNavigationButton(ctx, source) {
  if (!ctx.isCallback || source === CALLBACK_VALUE.NEW) {
    return mainMenuBackButton(ctx);
  }

  const faqSource = getFaqSource(source);

  if (faqSource) {
    return backButton(ctx, CALLBACK_ACTION.FAQ, faqSource);
  }

  return backButton(ctx, CALLBACK_ACTION.STATUS, source);
}

function getFaqSource(source) {
  if (source?.startsWith('faq:')) {
    return source.slice(4);
  }

  return source === CALLBACK_VALUE.OPEN ? CALLBACK_VALUE.USAGE : null;
}

function backButton(ctx, action, value) {
  return {
    text: `‹ ${ctx.i18n.t('menu.back')}`,
    callback_data: createCallbackData(action, value),
  };
}
