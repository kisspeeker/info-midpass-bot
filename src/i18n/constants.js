export const LOCALE = Object.freeze({ RU: 'ru', EN: 'en' });
export const DEFAULT_LOCALE = LOCALE.RU;
export const SUPPORTED_LOCALES = Object.freeze(Object.values(LOCALE));
export const LANGUAGE_NAMES = Object.freeze({
  [LOCALE.RU]: 'Русский',
  [LOCALE.EN]: 'English',
});
export const DATE_FORMATS = Object.freeze({
  [LOCALE.RU]: { locale: 'ru-RU', separator: '.' },
  [LOCALE.EN]: { locale: 'en-GB', separator: '/' },
});
export const STATUS_TEXT_LOCALE = DATE_FORMATS[LOCALE.RU].locale;
