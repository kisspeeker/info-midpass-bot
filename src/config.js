import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { LOCALE } from './i18n/constants.js';

export { DEFAULT_LOCALE } from './i18n/constants.js';

export const DB_PATH = process.env.DB_PATH === ':memory:'
  ? ':memory:' : resolve(process.env.DB_PATH ?? './data/bot.db');
export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const shutdown = new AbortController();
export const JOB_PORT = 8080;

export function requireBotToken() {
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(BOT_TOKEN ?? '')) {
    throw new Error('Set TELEGRAM_BOT_TOKEN');
  }

  return BOT_TOKEN;
}

export function maintenanceToken() {
  return createHash('sha256').update(requireBotToken()).digest('hex');
}

// Shared immutable configuration and domain identifiers.
export const PASSPORT_TYPE = Object.freeze({
  LEGACY_TYPE: 'LEGACY_TYPE',
  BIOMETRIC: 'BIOMETRIC',
});

export const CALLBACK_ACTION = Object.freeze({
  ABOUT: 'about',
  ADMIN: 'admin',
  CRYPTO_DONATION: 'crypto',
  DELETE_ACCOUNT: 'delete_account',
  FAQ: 'faq',
  LANGUAGE: 'language',
  MENU: 'menu',
  PASSPORT: 'passport',
  REFRESH: 'refresh',
  STATUS: 'status',
  SUBSCRIPTIONS: 'subscriptions',
  SUPPORT: 'support',
  UNSUBSCRIBE: 'unsubscribe',
  UNSUBSCRIBE_CONFIRM: 'unsub_ok',
});

export const CALLBACK_VALUE = Object.freeze({
  CANCEL: 'cancel',
  CONFIRM: 'confirm',
  EN: LOCALE.EN,
  LIST: 'list',
  NEW: 'new',
  OPEN: 'open',
  RU: LOCALE.RU,
  SELECT: 'select',
  STATUSES: 'statuses',
  USAGE: 'usage',
});

export const CALLBACK_DATA_MAX_LENGTH = 64;
export const CRYPTO_WALLETS = Object.freeze({
  BTC: Object.freeze({
    address: 'bc1qwzv0a6a95mut5k0jnv3fuu593vj45ngk0lywun',
    network: 'Bitcoin',
  }),
  USDT: Object.freeze({
    address: '0xca9755e648bef2363ab57f7ef01e4655f6c3d93f',
    network: 'Ethereum (ERC-20)',
  }),
});

export const TIME_ZONE = 'Europe/Moscow';
export const MAX_SUBSCRIPTIONS_PER_USER = 10;
export const INVALID_PASSPORT_RETENTION_SECONDS = 30 * 24 * 60 * 60;
export const STATUS_REFRESH_COOLDOWN_MS = 5 * 60_000;
export const SUPPORT_REQUEST_COOLDOWN_MS = 30_000;
export const LEGACY_TYPE_UID_MAX_LENGTH = CALLBACK_DATA_MAX_LENGTH
  - CALLBACK_ACTION.UNSUBSCRIBE.length
  - 1;
export const BIOMETRIC_FINAL_STATUS_FRAGMENTS = Object.freeze([
  'паспорт выдан',
  'отмена изготовления паспорта',
]);
export const LEGACY_TYPE_READY_STATUS_FRAGMENT = 'паспорт готов';

/** @type {{readonly USER: 'user', readonly ADMIN: 'admin'}} */
export const ROLE = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

export const ROLE_LEVEL = Object.freeze({
  [ROLE.USER]: 0,
  [ROLE.ADMIN]: 1,
});

export const PASSPORT_UPSTREAM_POLICY = Object.freeze({
  totalDeadlineMs: 60_000,
  minRequestStartIntervalMs: 2_000,
  requestDeadlineMs: 30_000,
  maxPendingRequests: 100,
});

export const PASSPORT_UPSTREAMS = Object.freeze({
  [PASSPORT_TYPE.LEGACY_TYPE]: {
    path: '/Petition/GetPetitionStatus',
    baseUrl: 'https://passportzu.kdmid.ru/',
    referer: 'https://passportzu.kdmid.ru/',
  },
  [PASSPORT_TYPE.BIOMETRIC]: {
    path: '/api/request',
    baseUrl: 'https://info.midpass.ru/',
    referer: 'https://info.midpass.ru/',
  },
});

export const STATUS_TEXT_MAX_LENGTH = 1_000;

export const COMMAND = Object.freeze({
  START: 'start',
  MENU: 'menu',
  SUPPORT: 'support',
  DELETE: 'delete',
  ADMIN: 'admin',
  CRYPTO_DONATION: 'crypto',
});

export const BOT_COMMANDS = Object.freeze([
  { command: COMMAND.START, description: 'commands.start' },
  { command: COMMAND.MENU, description: 'commands.menu' },
  { command: COMMAND.SUPPORT, description: 'commands.support' },
  { command: COMMAND.DELETE, description: 'commands.delete' },
  { command: COMMAND.ADMIN, description: 'commands.admin', role: ROLE.ADMIN },
]);

export const POLL_SCHEDULES = Object.freeze(['0 9,17 * * *', '0 13,21 * * 1-5']);
export const JOB_HOST = '127.0.0.1';
export const MAINTENANCE_URL = process.env.MAINTENANCE_URL ?? `http://${JOB_HOST}:${JOB_PORT}`;
export const HEALTH_TIMEOUT_MS = 4_000;
export const POLL_TIMEOUT_MS = 15 * 60_000;
export const HTTP_REQUEST_TIMEOUT_MS = 10_000;
export const HTTP_KEEP_ALIVE_TIMEOUT_MS = 5_000;
export const TELEGRAM_TIMEOUT_SECONDS = 60;
export const SQLITE_BUSY_TIMEOUT_MS = 5_000;

export const TELEGRAM_ADMIN_IDS = Object.freeze(
  (process.env.TELEGRAM_ADMIN_ID ?? '').split(',').filter(Boolean).map(Number),
);
export const UPSTREAM_HEADERS = Object.freeze({
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/141 Safari/537.36',
  'accept-encoding': 'identity',
});
