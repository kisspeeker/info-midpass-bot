import { Composer, InlineKeyboard } from 'grammy';

import { callbackPattern, createCallbackData } from '../lib/callback-data.js';
import { CALLBACK_ACTION, CALLBACK_VALUE } from '../config.js';
import { showPassportResult } from './passport-status.js';
import { mainMenuBackButton, showMainMenu } from './home.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const subscriptions = new Composer();

subscriptions.callbackQuery(callbackPattern(CALLBACK_ACTION.REFRESH), refreshSubscribedPassport);
subscriptions.callbackQuery(callbackPattern(CALLBACK_ACTION.STATUS), showSubscribedPassport);
subscriptions.callbackQuery(callbackPattern(CALLBACK_ACTION.SUBSCRIPTIONS), showSubscriptions);
subscriptions.callbackQuery(callbackPattern(CALLBACK_ACTION.UNSUBSCRIBE), requestUnsubscribe);
subscriptions.callbackQuery(callbackPattern(CALLBACK_ACTION.UNSUBSCRIBE_CONFIRM), confirmUnsubscribe);

async function showSubscribedPassport(ctx) {
  const result = await ctx.services.passports.getStatus(ctx.from.id, ctx.match[1]);

  await showPassportResult({ ctx, result });
}

async function showSubscriptions(ctx) {
  const orders = await ctx.services.passports.list(ctx.from.id);

  if (!orders.length) {
    await ctx.answerCallbackQuery({ text: ctx.i18n.t('subscriptions.empty'), show_alert: true });

    return;
  }

  await renderSubscriptions(ctx, orders);
}

async function refreshSubscribedPassport(ctx) {
  const fromSubscriptions = ctx.match[1].startsWith('l:');
  const uid = fromSubscriptions ? ctx.match[1].slice(2) : ctx.match[1];

  const result = await ctx.services.passports.refresh(ctx.from.id, {
    uid,
    showStatusOnCooldown: fromSubscriptions,
  });

  await showPassportResult({ ctx, result });
}

async function requestUnsubscribe(ctx) {
  if (!await ctx.services.passports.hasSubscription(ctx.from.id, ctx.match[1])) {
    await ctx.answerCallbackQuery({ text: ctx.i18n.t('subscriptions.notFound'), show_alert: true });

    return;
  }

  await ctx.editMessageText(ctx.i18n.t('subscriptions.unsubscribePrompt', ctx.match[1].slice(-6)), {
    reply_markup: new InlineKeyboard()
      .text(ctx.i18n.t('subscriptions.unsubscribeConfirm'), createCallbackData(CALLBACK_ACTION.UNSUBSCRIBE_CONFIRM, ctx.match[1]))
      .text(ctx.i18n.t('subscriptions.unsubscribeCancel'), createCallbackData(CALLBACK_ACTION.SUBSCRIPTIONS, CALLBACK_VALUE.LIST)),
  });
}

async function confirmUnsubscribe(ctx) {
  const result = await ctx.services.passports.unsubscribe(ctx.from.id, ctx.match[1]);

  if (result.status === 'notFound') {
    await ctx.answerCallbackQuery({ text: ctx.i18n.t('subscriptions.notFound'), show_alert: true });

    return;
  }

  await ctx.answerCallbackQuery({ text: ctx.i18n.t('subscriptions.removed') });

  if (!result.orders.length) {
    await showMainMenu(ctx);

    return;
  }

  await renderSubscriptions(ctx, result.orders);
}

async function renderSubscriptions(ctx, orders) {
  const keyboard = new InlineKeyboard();

  for (const order of orders) {
    keyboard.text(ctx.i18n.t('subscriptions.refreshButton', {
      action: ctx.i18n.t('subscriptions.refresh'), type: ctx.i18n.passportLabel(order.type), uid: order.uid.slice(-6),
    }), createCallbackData(CALLBACK_ACTION.REFRESH, `l:${order.uid}`)).row();
    keyboard.text(ctx.i18n.t('subscriptions.unsubscribeButton', {
      action: ctx.i18n.t('subscriptions.unsubscribe'), uid: order.uid.slice(-6),
    }), createCallbackData(CALLBACK_ACTION.UNSUBSCRIBE, order.uid)).row();
  }

  keyboard.add(mainMenuBackButton(ctx));
  await ctx.editMessageText(ctx.i18n.t('subscriptions.choose'), { reply_markup: keyboard });
}
