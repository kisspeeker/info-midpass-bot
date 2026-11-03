import { InlineKeyboard } from 'grammy';

import { DATE_FORMATS, PASSPORT_TYPE, MAX_SUBSCRIPTIONS_PER_USER, TIME_ZONE } from '../../constants.js';
import { toDate } from '../../helpers/time.js';
import { escapeHtml } from '../../helpers/text.js';

export function formatPassportStatus(order, i18n) {
  const metadata = [
    i18n.t('passport.applicationTitle'),
    i18n.t('passport.applicationLine', escapeHtml(order.uid)),
  ];

  if (order.type !== PASSPORT_TYPE.LEGACY_TYPE) {
    metadata.push(i18n.t('passport.receptionDate', escapeHtml(formatDate(order.receptionDate, i18n.locale))));
  }

  metadata.push(i18n.t('passport.updatedLine', escapeHtml(formatDateTime(order.checkedAt, i18n.locale))));

  if (order.type === PASSPORT_TYPE.LEGACY_TYPE) {
    return [`<b>${escapeHtml(order.statusText)}</b>`, metadata.join('\n')].join('\n\n');
  }

  if (!order.passportStatusName || !order.internalStatusName) {
    return [
      [i18n.t('passport.pendingTitle'), i18n.t('passport.pending')].join('\n'),
      metadata.join('\n'),
    ].join('\n\n');
  }

  return [
    i18n.t('passport.summary', {
      percent: escapeHtml(order.internalStatusPercent), status: escapeHtml(order.internalStatusName),
    }),
    i18n.t('passport.statusLine', escapeHtml(order.passportStatusName)),
    '',
    ...metadata,
  ].join('\n');
}

function formatDate(value, locale) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  const separator = DATE_FORMATS[locale].separator;

  return match ? [match[3], match[2], match[1]].join(separator) : '—';
}

function formatDateTime(value, locale) {
  return toDate(value).toLocaleString(DATE_FORMATS[locale].locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE,
  });
}

export function passportStatusMessage({ order, i18n, notification = false, prefix = '', suffix = '' }) {
  const text = [prefix ? `<b>${prefix}</b>` : '', formatPassportStatus(order, i18n), suffix].filter(Boolean).join('\n\n');
  const keyboard = notification
    ? new InlineKeyboard().text(i18n.t('commands.crypto'), 'crypto:new')
    : new InlineKeyboard()
      .text(i18n.t('subscriptions.refresh'), `refresh:${order.uid}`).row()
      .text(i18n.t('commands.subscriptions'), 'subscriptions')
      .text(i18n.t('menu.main'), 'menu');

  return { text, keyboard };
}

export async function showPassportResult({ ctx, result, i18n = ctx.i18n }) {
  if (result.status === 'recent') {
    await ctx.reply(i18n.t('passport.recent'));
  }

  if (result.order) {
    const prefixes = { added: 'passport.added', alreadyTracked: 'subscriptions.alreadyTracked', refreshed: 'passport.refreshed' };
    const { text, keyboard } = passportStatusMessage({
      i18n, order: result.order, prefix: prefixes[result.status] ? i18n.t(prefixes[result.status]) : '',
    });

    return ctx.callbackQuery
      ? ctx.screen(text, keyboard, { parse_mode: 'HTML' })
      : ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  const errors = {
    limit: 'subscriptions.limit', fetchFailed: 'passport.fetchFailed', notFound: 'subscriptions.notFound',
    applicationNotFound: 'passport.applicationNotFound', refreshFailed: 'passport.refreshFailed',
  };

  if (errors[result.status]) {
    return ctx.reply(i18n.t(errors[result.status], MAX_SUBSCRIPTIONS_PER_USER));
  }
}
