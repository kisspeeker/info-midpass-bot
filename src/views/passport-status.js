import { InlineKeyboard } from 'grammy';

import { DATE_FORMATS } from '../i18n/constants.js';
import {
  CALLBACK_ACTION,
  CALLBACK_VALUE,
  PASSPORT_TYPE,
  MAX_SUBSCRIPTIONS_PER_USER,
  TIME_ZONE,
} from '../config.js';
import { createCallbackData } from '../lib/callback-data.js';
import { toDate } from '../lib/time.js';
import { escapeHtml } from '../lib/text.js';
import { showMessage } from '../lib/telegram.js';

export function formatPassportStatus(order, i18n) {
  const metadata = [
    i18n.t('passport.applicationTitle'),
    i18n.t('passport.applicationLine', escapeHtml(order.uid)),
    i18n.t('passport.updatedLine', escapeHtml(formatDateTime(order.checkedAt, i18n.locale))),
  ];

  if (order.type === PASSPORT_TYPE.LEGACY_TYPE) {
    return [
      `<b>${escapeHtml(order.statusText)}</b>`,
      metadata.join('\n'),
    ].join('\n\n');
  }

  metadata.splice(
    -1,
    0,
    i18n.t('passport.receptionDate', escapeHtml(formatDate(order.receptionDate, i18n.locale))),
  );

  if (!order.passportStatusName || !order.internalStatusName) {
    return [
      [i18n.t('passport.pendingTitle'), i18n.t('passport.pending')].join('\n'),
      metadata.join('\n'),
    ].join('\n\n');
  }

  return [
    i18n.t('passport.summary', {
      percent: escapeHtml(order.internalStatusPercent),
      status: escapeHtml(order.internalStatusName),
    }),
    i18n.t('passport.statusLine', escapeHtml(order.passportStatusName)),
    '',
    ...metadata,
  ].join('\n');
}

function formatDate(value, locale) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');

  if (!match) {
    return '—';
  }

  const { separator } = DATE_FORMATS[locale];

  return `${match[3]}${separator}${match[2]}${separator}${match[1]}`;
}

function formatDateTime(value, locale) {
  return toDate(value).toLocaleString(DATE_FORMATS[locale].locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });
}

export function passportStatusMessage(status) {
  const {
    order,
    i18n,
    notification = false,
    prefix = '',
    suffix = '',
  } = status;
  const text = [prefix ? `<b>${prefix}</b>` : '', formatPassportStatus(order, i18n), suffix]
    .filter(Boolean)
    .join('\n\n');

  const extra = {
    parse_mode: 'HTML',
    reply_markup: createStatusKeyboard({ i18n, order, notification }),
  };

  return { text, extra };
}

function createStatusKeyboard({ i18n, order, notification }) {
  if (notification) {
    return new InlineKeyboard().text(i18n.t('cryptoDonation.open'), createCallbackData(CALLBACK_ACTION.CRYPTO_DONATION, CALLBACK_VALUE.NEW));
  }

  return new InlineKeyboard()
    .text(i18n.t('subscriptions.refresh'), createCallbackData(CALLBACK_ACTION.REFRESH, order.uid)).row()
    .text(i18n.t('menu.subscriptions'), createCallbackData(CALLBACK_ACTION.SUBSCRIPTIONS, CALLBACK_VALUE.LIST))
    .text(i18n.t('menu.main'), createCallbackData(CALLBACK_ACTION.MENU, CALLBACK_VALUE.OPEN));
}

export async function showPassportResult({ ctx, result, i18n = ctx.i18n }) {
  if (result.status === 'recent') {
    await ctx.answerCallbackQuery({ text: i18n.t('passport.recent') });
  }

  if ('order' in result && result.order) {
    const prefixes = { added: 'passport.added', alreadyTracked: 'subscriptions.alreadyTracked', refreshed: 'passport.refreshed' };

    const { text, extra } = passportStatusMessage({
      i18n, order: result.order,
      prefix: prefixes[result.status] ? i18n.t(prefixes[result.status]) : '',
    });

    await showMessage({ ctx, text, extra });

    return;
  }

  if (result.status === 'limit' || result.status === 'fetchFailed') {
    await ctx.reply(i18n.t(result.status === 'limit' ? 'subscriptions.limit' : 'passport.fetchFailed', MAX_SUBSCRIPTIONS_PER_USER));

    return;
  }

  const alerts = { notFound: 'subscriptions.notFound', applicationNotFound: 'passport.applicationNotFound', refreshFailed: 'passport.refreshFailed' };

  if (alerts[result.status]) {
    await ctx.answerCallbackQuery({ text: i18n.t(alerts[result.status]), show_alert: true });
  }
}
