import { STATUS_TEXT_LOCALE } from '../i18n/constants.js';

export function includesStatus(value, fragment) {
  return normalizeStatus(value).includes(normalizeStatus(fragment));
}

function normalizeStatus(value) {
  return String(value ?? '').trim().toLocaleLowerCase(STATUS_TEXT_LOCALE);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
