import { logger } from '../lib/logger.js';
import { DEFAULT_LOCALE, ROLE } from '../config.js';
import { createI18n, LOCALES } from '../i18n/index.js';

export function createProfileClient({ api, users, commands }) {
  function localizedCommands(i18n, role) {
    return commands.filter((command) => !command.role || command.role === role)
      .map((command) => ({ command: command.command, description: i18n.t(command.description) }));
  }

  async function configureChat(id, languageCode) {
    const i18n = createI18n(languageCode ?? await users.getLocale(id));
    const role = await users.getRole(id);

    await api.setMyCommands(localizedCommands(i18n, role), { scope: { type: 'chat', chat_id: id } });
  }

  return {
    configureAdmin: configureChat,
    configureChat,
    resetAdmin: (id) => api.deleteMyCommands({ scope: { type: 'chat', chat_id: id } }),
    async configure() {
      for (const locale of [null, ...Object.keys(LOCALES)]) {
        const i18n = createI18n(locale ?? DEFAULT_LOCALE);
        const language = locale ? { language_code: locale } : {};

        await Promise.all([
          api.setMyCommands(localizedCommands(i18n), language),
          api.setMyDescription({ description: i18n.t('bot.description'), ...language }),
          api.setMyShortDescription({ short_description: i18n.t('bot.shortDescription'), ...language }),
        ]);
      }

      for (const admin of await users.admins()) {
        try {
          await configureChat(admin.telegramUserId, admin.languageCode);
        } catch (error) {
          if (error.error_code !== 403 && !(error.error_code === 400 && error.description?.includes('chat not found'))) {
            throw error;
          }

          logger.warn('admin_commands_sync_skipped', { code: error.error_code });
        }
      }

      return { ok: true };
    },
  };
}
