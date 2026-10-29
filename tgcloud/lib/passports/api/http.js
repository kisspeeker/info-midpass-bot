import { fetch } from 'sdk';

import {
  PASSPORT_SERVICE_AUTHORIZATION_SETTING_KEY,
  PASSPORT_SERVICE_API_PREFIX,
  PASSPORT_SERVICE_BASE_URL_SETTING_KEY,
  PASSPORT_TYPE,
} from '../../core/constants.js';
import { getSetting } from '../../repository/settings.js';

const REQUEST_HEADERS = {
  Accept: 'application/json, text/plain, */*',
};
const PASSPORT_PATHS = Object.freeze({
  [PASSPORT_TYPE.LEGACY_TYPE]: 'legacy',
  [PASSPORT_TYPE.BIOMETRIC]: 'biometric',
});
const ALLOW_PENDING_QUERY = '?allowPending=1';
const TRAILING_SLASH_PATTERN = /\/$/;

export async function getPassport(input) {
  const {
    type,
    uid,
    allowPending,
  } = input;
  const [baseUrl, authorization] = await Promise.all([
    getSetting(PASSPORT_SERVICE_BASE_URL_SETTING_KEY),
    getSetting(PASSPORT_SERVICE_AUTHORIZATION_SETTING_KEY),
  ]);
  const passportPath = PASSPORT_PATHS[type];

  if (!baseUrl || !authorization) {
    throw new Error('Passport service is not configured');
  }

  if (!passportPath) {
    throw new Error('Unknown passport type');
  }

  const url = `${baseUrl.replace(TRAILING_SLASH_PATTERN, '')}${PASSPORT_SERVICE_API_PREFIX}/${passportPath}/${encodeURIComponent(uid)}${allowPending ? ALLOW_PENDING_QUERY : ''}`;

  const headers = {
    ...REQUEST_HEADERS,
    Authorization: authorization,
    'X-Request-Id': createRequestId(),
  };
  const response = await fetch(url, { headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Passport service returned ${response.status}: ${data?.error?.code ?? 'unknown_error'}`);
  }

  if (data?.status === 'pending' && allowPending) {
    return {};
  }

  if (data?.status !== 'found' || !data.passport) {
    throw new Error('Invalid passport service response');
  }

  return data.passport;
}

function createRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
