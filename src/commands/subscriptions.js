import { Composer } from 'grammy';

import { showMenu } from './menu.js';
import { showPassportResult } from './passport/message.js';

export const subscriptions = new Composer();

export function showSubscriptions(ctx, orders) {
  orders ??= ctx.services.passports.list(ctx.from.id);

  if (!orders.length) {
    return ctx.reply(ctx.t('subscriptions.empty'));
  }

  const keyboard = ctx.keyboard();

  for (const order of orders) {
    keyboard.text(ctx.t('subscriptions.refreshButton', {
      action: ctx.t('subscriptions.refresh'), type: ctx.i18n.passportLabel(order.type), uid: order.uid.slice(-6),
    }), `refresh:l:${order.uid}`).row();
    keyboard.text(ctx.t('subscriptions.unsubscribeButton', {
      action: ctx.t('subscriptions.unsubscribe'), uid: order.uid.slice(-6),
    }), `unsubscribe:${order.uid}`).row();
  }

  keyboard.text(ctx.t('menu.back'), 'menu');

  return ctx.screen(ctx.t('subscriptions.choose'), keyboard);
}

subscriptions.callbackQuery(['subscriptions', 'subscriptions:list'], (ctx) => showSubscriptions(ctx));

subscriptions.callbackQuery(/^status:(\d+)$/, (ctx) => {
  const result = ctx.services.passports.getStatus(ctx.from.id, ctx.match[1]);

  return showPassportResult({ ctx, result });
});

subscriptions.callbackQuery(/^refresh:(l:)?(\d+)$/, async (ctx) => {
  const result = await ctx.services.passports.refresh(ctx.from.id, {
    uid: ctx.match[2], showStatusOnCooldown: Boolean(ctx.match[1]),
  });

  return showPassportResult({ ctx, result });
});

subscriptions.callbackQuery(/^unsubscribe:(\d+)$/, (ctx) => {
  const uid = ctx.match[1];

  if (!ctx.services.passports.hasSubscription(ctx.from.id, uid)) {
    return ctx.reply(ctx.t('subscriptions.notFound'));
  }

  const keyboard = ctx.keyboard()
    .text(ctx.t('subscriptions.unsubscribeConfirm'), `unsub_ok:${uid}`)
    .text(ctx.t('subscriptions.unsubscribeCancel'), 'subscriptions');

  return ctx.screen(ctx.t('subscriptions.unsubscribePrompt', uid.slice(-6)), keyboard);
});

subscriptions.callbackQuery(/^unsub_ok:(\d+)$/, async (ctx) => {
  const result = ctx.services.passports.unsubscribe(ctx.from.id, ctx.match[1]);

  if (result.status === 'notFound') {
    return ctx.reply(ctx.t('subscriptions.notFound'));
  }

  await ctx.reply(ctx.t('subscriptions.removed'));

  return result.orders.length ? showSubscriptions(ctx, result.orders) : showMenu(ctx);
});
