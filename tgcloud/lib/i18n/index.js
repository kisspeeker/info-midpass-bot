import { DEFAULT_LOCALE, PASSPORT_TYPE } from '../core/constants.js';
import en from './en.js';
import ru from './ru.js';

export const LOCALES = Object.freeze({ en, ru });

export function localeFrom(value) {
  return String(value ?? '').toLowerCase().startsWith('en') ? 'en' : DEFAULT_LOCALE;
}

export function t(locale, key, params) {
  let value = LOCALES[localeFrom(locale)];

  for (const part of key.split('.')) {
    value = value && Object.hasOwn(value, part) ? value[part] : null;
  }

  if (value == null) {
    throw new Error(`Unknown translation key: ${key}`);
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

export function passportContextFromPrompt(prompt) {
  for (const locale of Object.keys(LOCALES)) {
    for (const type of Object.values(PASSPORT_TYPE)) {
      if (passportPrompt(locale, type) === prompt) {
        return { locale, type };
      }
    }
  }

  return null;
}

export function isSupportPrompt(value) {
  return isTranslation(value, 'support.prompt');
}

export function isTranslation(value, key, params) {
  return Object.keys(LOCALES).some((locale) => t(locale, key, params) === value);
}

function assertPassportType(type) {
  if (!Object.values(PASSPORT_TYPE).includes(type)) {
    throw new Error('Unknown passport type');
  }
}
