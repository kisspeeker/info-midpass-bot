import { createCallbackData } from '../../core/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../../core/constants.js';
import { mainMenuBackButton } from './menu.js';

export const faqCallbackRoutes = [{
  action: CALLBACK_ACTION.FAQ,
  handle: showFaq,
}];

async function showFaq(ctx, route) {
  const key = route.value === CALLBACK_VALUE.STATUSES ? 'faq.statuses' : 'faq.usage';

  await ctx.edit(ctx.i18n.t(key), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{
        text: ctx.i18n.t('crypto.open'),
        callback_data: createCallbackData(CALLBACK_ACTION.CRYPTO, `faq:${route.value}`),
      }], [mainMenuBackButton(ctx)]],
    },
  });
}
