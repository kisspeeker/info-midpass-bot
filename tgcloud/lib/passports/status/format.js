import {
  BIOMETRIC_FINAL_STATUS_FRAGMENTS,
  LEGACY_TYPE_READY_STATUS_FRAGMENT,
  PASSPORT_TYPE,
} from '../../core/constants.js';
import { toDate } from '../../helpers/time.js';
import { includesStatus } from './text.js';

const BIOMETRIC_STATUS_FIELDS = [
  'sourceUid',
  'receptionDate',
  'passportStatusId',
  'passportStatusName',
  'passportStatusDescription',
  'passportStatusColor',
  'passportStatusSubscription',
  'internalStatusName',
  'internalStatusPercent',
];

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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function hasPassportChanged(order, next) {
  const fields = order.type === PASSPORT_TYPE.LEGACY_TYPE
    ? ['statusText']
    : BIOMETRIC_STATUS_FIELDS;

  return fields.some((field) => order[field] !== next[field]);
}

export function isFinalPassportStatus(order) {
  if (order.type === PASSPORT_TYPE.LEGACY_TYPE) {
    return includesStatus(order.statusText, LEGACY_TYPE_READY_STATUS_FRAGMENT);
  }

  if (order.type !== PASSPORT_TYPE.BIOMETRIC || order.internalStatusPercent !== 0) {
    return false;
  }

  return BIOMETRIC_FINAL_STATUS_FRAGMENTS.some((fragment) => (
    includesStatus(order.internalStatusName, fragment)
  ));
}

function formatDate(value, locale) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');

  if (!match) {
    return '—';
  }

  const separator = locale === 'en' ? '/' : '.';

  return `${match[3]}${separator}${match[2]}${separator}${match[1]}`;
}

function formatDateTime(value, locale) {
  return toDate(value).toLocaleString(locale === 'en' ? 'en-GB' : 'ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}
