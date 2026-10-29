import {
  PASSPORT_SERVICE_AUTHORIZATION_SETTING_KEY,
  PASSPORT_SERVICE_BASE_URL_SETTING_KEY,
} from './constants.js';

const HTTPS_BASE_URL_PATTERN = /^https:\/\/[^/?#\s]+(?:\/[^?#\s]*)?$/;
const BASIC_AUTHORIZATION_PATTERN = /^Basic [A-Za-z0-9+/]+={0,2}$/;

export const SETTING_DEFINITIONS = Object.freeze({
  [PASSPORT_SERVICE_BASE_URL_SETTING_KEY]: Object.freeze({
    env: 'PASSPORT_SERVICE_URL',
    normalize: normalizeBaseUrl,
  }),
  [PASSPORT_SERVICE_AUTHORIZATION_SETTING_KEY]: Object.freeze({
    env: 'PASSPORT_SERVICE_AUTHORIZATION',
    normalize: normalizeAuthorization,
    sensitive: true,
  }),
});

export function getSettingDefinition(key) {
  return Object.hasOwn(SETTING_DEFINITIONS, key) ? SETTING_DEFINITIONS[key] : null;
}

function normalizeBaseUrl(value) {
  const baseUrl = String(value ?? '').trim();

  if (!HTTPS_BASE_URL_PATTERN.test(baseUrl)) {
    throw new Error('Invalid passport API base URL');
  }

  if (baseUrl.includes('@')) {
    throw new Error('Invalid passport API base URL');
  }

  return baseUrl.replace(/\/$/, '');
}

function normalizeAuthorization(value) {
  const authorization = String(value ?? '').trim();

  if (!BASIC_AUTHORIZATION_PATTERN.test(authorization)) {
    throw new Error('Invalid passport API authorization');
  }

  return authorization;
}
