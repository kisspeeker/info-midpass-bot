import { createCallbackData } from '../../core/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../../core/constants.js';
import { formatPassportStatus } from './format.js';

export async function sendPassportStatus(ctx, status) {
  const {
    order,
    i18n = ctx.i18n,
    notification = false,
    prefix = '',
    suffix = '',
  } = status;
  const text = [prefix ? `<b>${prefix}</b>` : '', formatPassportStatus(order, i18n), suffix]
    .filter(Boolean)
    .join('\n\n');

  const extra = {
    parse_mode: 'HTML',
    reply_markup: createStatusKeyboard(i18n, order, notification),
  };

  if (ctx.isCallback) {
    await ctx.edit(text, extra);

    return;
  }

  await ctx.reply(text, extra);
}

function createStatusKeyboard(i18n, order, notification) {
  if (notification) {
    return {
      inline_keyboard: [[{
        text: i18n.t('crypto.open'),
        callback_data: createCallbackData(CALLBACK_ACTION.CRYPTO, CALLBACK_VALUE.NEW),
      }]],
    };
  }

  return {
    inline_keyboard: [[{
      text: i18n.t('subscriptions.refresh'),
      callback_data: createCallbackData(CALLBACK_ACTION.REFRESH, order.uid),
    }], [{
      text: i18n.t('menu.subscriptions'),
      callback_data: createCallbackData(CALLBACK_ACTION.SUBSCRIPTIONS, CALLBACK_VALUE.LIST),
    }, {
      text: i18n.t('menu.main'),
      callback_data: createCallbackData(CALLBACK_ACTION.MENU, CALLBACK_VALUE.OPEN),
    }]],
  };
}
