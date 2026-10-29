import {
  DEFAULT_LOCALE,
  PASSPORT_SERVICE_AUTHORIZATION_SETTING_KEY,
  PASSPORT_SERVICE_BASE_URL_SETTING_KEY,
} from '../constants.js';
import { telegram } from '../telegram.js';
import { createI18n, LOCALES } from '../../i18n/index.js';
import { saveSetting } from '../../repository/settings.js';
import { getAdmins, getUserLocale } from '../../repository/users.js';

const HTTPS_BASE_URL_PATTERN = /^https:\/\/[^/?#\s]+(?:\/[^?#\s]*)?$/;
const BASIC_AUTHORIZATION_PATTERN = /^Basic [A-Za-z0-9+/]+={0,2}$/;

export async function configurePassportService(input) {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const authorization = normalizeAuthorization(input.authorization);

  await saveSetting(PASSPORT_SERVICE_AUTHORIZATION_SETTING_KEY, authorization);
  await saveSetting(PASSPORT_SERVICE_BASE_URL_SETTING_KEY, baseUrl);

  return { ok: true, baseUrl };
}

export async function configureBot() {
  const locales = Object.keys(LOCALES);
  const commands = Object.fromEntries(locales.map((locale) => {
    const i18n = createI18n(locale);

    return [locale, userCommands(i18n)];
  }));

  await telegram.setCommands({ commands: commands[DEFAULT_LOCALE] });

  for (const locale of locales) {
    await telegram.setCommands({ commands: commands[locale], language_code: locale });
  }

  for (const admin of await getAdmins()) {
    await configureAdminCommands(admin.telegramUserId, admin.languageCode);
  }

  return { ok: true };
}

export async function configureAdminCommands(telegramUserId, languageCode) {
  const i18n = createI18n(languageCode ?? await getUserLocale(telegramUserId));

  await telegram.setCommands({
    commands: [
      ...userCommands(i18n),
      { command: 'admin', description: i18n.t('commands.admin') },
    ],
    scope: { type: 'chat', chat_id: telegramUserId },
  });
}

export async function resetAdminCommands(telegramUserId) {
  await telegram.deleteChatCommands(telegramUserId);
}

function userCommands(i18n) {
  return [
    { command: 'start', description: i18n.t('commands.start') },
    { command: 'menu', description: i18n.t('commands.menu') },
    { command: 'support', description: i18n.t('commands.support') },
    { command: 'delete', description: i18n.t('commands.delete') },
  ];
}

function normalizeBaseUrl(value) {
  const baseUrl = String(value ?? '').trim();

  if (
    !HTTPS_BASE_URL_PATTERN.test(baseUrl)
    || baseUrl.includes('@')
  ) {
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
