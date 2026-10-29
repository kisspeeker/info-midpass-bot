// Shared immutable configuration and domain identifiers.
export const PASSPORT_TYPE = Object.freeze({
  LEGACY_TYPE: 'LEGACY_TYPE',
  BIOMETRIC: 'BIOMETRIC',
});

export const CALLBACK_ACTION = Object.freeze({
  ADMIN: 'admin',
  CRYPTO: 'crypto',
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
  EN: 'en',
  LIST: 'list',
  NEW: 'new',
  OPEN: 'open',
  RU: 'ru',
  SELECT: 'select',
  STATUSES: 'statuses',
  USAGE: 'usage',
});

export const CALLBACK_DATA_MAX_LENGTH = 64;
export const BACKUP_OUTPUT_PREFIX = 'TGCLOUD_BACKUP:';
export const BACKUP_FORMAT_VERSION = 2;
export const BACKUP_TABLE_NAMES = Object.freeze(['users', 'orders', 'subscriptions']);
export const BACKUP_RESTORE_BATCH_SIZE = 25;
export const BACKUP_MAX_BYTES = 64 * 1024 * 1024;
export const PASSPORT_SERVICE_BASE_URL_SETTING_KEY = 'passport_service_base_url';
export const PASSPORT_SERVICE_AUTHORIZATION_SETTING_KEY = 'passport_service_authorization';
export const PASSPORT_SERVICE_API_PREFIX = '/v1/passports';
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

export const DEFAULT_LOCALE = 'ru';
export const MAX_SUBSCRIPTIONS_PER_USER = 10;
export const STATUS_REFRESH_COOLDOWN_MS = 5 * 60_000;
export const SUPPORT_REQUEST_COOLDOWN_MS = 30_000;
export const POLL_CONCURRENCY = 5;
export const POLL_LOCK_TTL_MS = 15 * 60_000;
export const POLL_LOCK_NAME = 'passports';
export const LEGACY_TYPE_UID_MAX_LENGTH = CALLBACK_DATA_MAX_LENGTH
  - CALLBACK_ACTION.UNSUBSCRIBE.length
  - 1;
export const BIOMETRIC_FINAL_STATUS_FRAGMENTS = Object.freeze([
  'паспорт выдан',
  'отмена изготовления паспорта',
]);
export const LEGACY_TYPE_READY_STATUS_FRAGMENT = 'паспорт готов';
