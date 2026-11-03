import { PASSPORT_TYPE } from '../constants.js';
import { DEFAULT_LOCALE, LOCALE, SUPPORTED_LOCALES } from '../constants.js';
import en from './en.js';
import ru from './ru.js';

export const LOCALES = Object.freeze({ [LOCALE.EN]: en, [LOCALE.RU]: ru });

export function localeFrom(value) {
  const locale = String(value ?? '').toLowerCase().split(/[-_]/)[0];

  return SUPPORTED_LOCALES.find((supported) => supported === locale) ?? DEFAULT_LOCALE;
}

export function t(locale, key, params) {
  let value = LOCALES[localeFrom(locale)];

  for (const part of key.split('.')) {
    value = value?.[part];
  }

  return typeof value === 'function' ? value(params) : value;
}

export function createI18n(languageCode) {
  const locale = localeFrom(languageCode);

  return {
    locale,
    t: (key, params) => t(locale, key, params),
    passportLabel: (type) => passportLabel(locale, type),
    passportPrompt: (type) => passportPrompt(locale, type),
  };
}

export function passportLabel(locale, type) {
  assertPassportType(type);

  return type === PASSPORT_TYPE.LEGACY_TYPE
    ? t(locale, 'passport.legacyType')
    : t(locale, 'passport.biometric');
}

export function passportPrompt(locale, type) {
  assertPassportType(type);

  return type === PASSPORT_TYPE.LEGACY_TYPE
    ? t(locale, 'passport.legacyTypePrompt')
    : t(locale, 'passport.biometricPrompt');
}

function assertPassportType(type) {
  if (!Object.values(PASSPORT_TYPE).includes(type)) {
    throw new Error('Unknown passport type');
  }
}
