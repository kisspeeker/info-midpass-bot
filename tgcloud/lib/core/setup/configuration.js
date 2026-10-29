import { DEFAULT_LOCALE } from '../constants.js';
import { telegram } from '../telegram.js';
import { createI18n, LOCALES } from '../../i18n/index.js';
import { getAdmins, getUserLocale } from '../../repository/users.js';

export async function configureBot() {
  const locales = Object.keys(LOCALES);
  const configurations = Object.fromEntries(locales.map((locale) => {
    const i18n = createI18n(locale);

    return [locale, {
      commands: userCommands(i18n),
      description: i18n.t('bot.description'),
      shortDescription: i18n.t('bot.shortDescription'),
    }];
  }));

  await configureBotProfile(configurations[DEFAULT_LOCALE]);

  for (const locale of locales) {
    await configureBotProfile(configurations[locale], locale);
  }

  for (const admin of await getAdmins()) {
    await configureAdminCommands(admin.telegramUserId, admin.languageCode);
  }

  return { ok: true };
}

async function configureBotProfile(configuration, languageCode) {
  const language = languageCode ? { language_code: languageCode } : {};

  await Promise.all([
    telegram.setCommands({ commands: configuration.commands, ...language }),
    telegram.setDescription({ description: configuration.description, ...language }),
    telegram.setShortDescription({
      short_description: configuration.shortDescription,
      ...language,
    }),
  ]);
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

