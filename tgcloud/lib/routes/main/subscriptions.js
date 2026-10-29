import { createCallbackData } from '../../core/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../../core/constants.js';
import { findPassport } from '../../repository/passports.js';
import { refreshPassport } from '../../passports/tracking/index.js';
import { sendPassportStatus } from '../../passports/status/index.js';
import {
  findSubscription,
  getSubscribedOrders,
  removeSubscription,
} from '../../repository/subscriptions.js';
import { mainMenuBackButton, showMainMenu } from './menu.js';

export const subscriptionsCallbackRoutes = [
  { action: CALLBACK_ACTION.REFRESH, handle: refreshSubscribedPassport },
  { action: CALLBACK_ACTION.STATUS, handle: showSubscribedPassport },
  { action: CALLBACK_ACTION.SUBSCRIPTIONS, handle: showSubscriptions },
  { action: CALLBACK_ACTION.UNSUBSCRIBE, handle: requestUnsubscribe },
  { action: CALLBACK_ACTION.UNSUBSCRIBE_CONFIRM, handle: confirmUnsubscribe },
];

async function showSubscribedPassport(ctx, route) {
  if (!await findSubscription(ctx.from.id, route.value)) {
    await ctx.alert(ctx.i18n.t('subscriptions.notFound'));

    return;
  }

  const order = await findPassport(route.value);

  if (!order) {
    await ctx.alert(ctx.i18n.t('passport.applicationNotFound'));

    return;
  }

  await sendPassportStatus(ctx, { order });
}

async function showSubscriptions(ctx) {
  const orders = await getSubscribedOrders(ctx.from.id);

  if (!orders.length) {
    await ctx.alert(ctx.i18n.t('subscriptions.empty'));

    return;
  }

  await renderSubscriptions(ctx, orders);
}

async function refreshSubscribedPassport(ctx, route) {
  const fromSubscriptions = route.value.startsWith('l:');
  const uid = fromSubscriptions ? route.value.slice(2) : route.value;

  await refreshPassport(ctx, {
    uid,
    skipCooldown: route.services.skipCooldown,
    showStatusOnCooldown: fromSubscriptions,
  });
}

async function requestUnsubscribe(ctx, route) {
  if (!await findSubscription(ctx.from.id, route.value)) {
    await ctx.alert(ctx.i18n.t('subscriptions.notFound'));

    return;
  }

  await ctx.edit(ctx.i18n.t('subscriptions.unsubscribePrompt', route.value.slice(-6)), {
    reply_markup: {
      inline_keyboard: [[
        {
          text: ctx.i18n.t('subscriptions.unsubscribeConfirm'),
          callback_data: createCallbackData(
            CALLBACK_ACTION.UNSUBSCRIBE_CONFIRM,
            route.value,
          ),
        },
        {
          text: ctx.i18n.t('subscriptions.unsubscribeCancel'),
          callback_data: createCallbackData(
            CALLBACK_ACTION.SUBSCRIPTIONS,
            CALLBACK_VALUE.LIST,
          ),
        },
      ]],
    },
  });
}

async function confirmUnsubscribe(ctx, route) {
  if (!await findSubscription(ctx.from.id, route.value)) {
    await ctx.alert(ctx.i18n.t('subscriptions.notFound'));

    return;
  }

  await removeSubscription(ctx.from.id, route.value);
  await ctx.notify(ctx.i18n.t('subscriptions.removed'));

  const orders = await getSubscribedOrders(ctx.from.id);

  if (!orders.length) {
    await showMainMenu(ctx);

    return;
  }

  await renderSubscriptions(ctx, orders);
}

async function renderSubscriptions(ctx, orders) {
  await ctx.edit(ctx.i18n.t('subscriptions.choose'), {
    reply_markup: {
      inline_keyboard: [
        ...orders.flatMap((order) => [[{
          text: `${ctx.i18n.t('subscriptions.refresh')} · ${ctx.i18n.passportLabel(order.type)} · *${order.uid.slice(-6)}`,
          callback_data: createCallbackData(CALLBACK_ACTION.REFRESH, `l:${order.uid}`),
        }], [{
          text: `${ctx.i18n.t('subscriptions.unsubscribe')} · *${order.uid.slice(-6)}`,
          callback_data: createCallbackData(CALLBACK_ACTION.UNSUBSCRIBE, order.uid),
        }]]),
        [mainMenuBackButton(ctx)],
      ],
    },
  });
}
