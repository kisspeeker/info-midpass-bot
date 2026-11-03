import { ROLE } from '../constants.js';
import { logger } from '../services/logger.js';
import { DEFAULT_LOCALE } from '../constants.js';
import { createI18n, LOCALES } from '../i18n/index.js';

export function createProfileClient({ api, users }) {
  function localizedCommands(i18n, role = ROLE.USER) {
    const commands = ['start', 'menu', 'support', 'delete', 'crypto'];

    if (role === ROLE.ADMIN) {
      commands.push('admin');
    }

    return commands.map((command) => ({ command, description: i18n.t(`commands.${command}`) }));
  }

  async function configureChat(id, languageCode) {
    const i18n = createI18n(languageCode ?? users.getLocale(id));
    const role = users.getRole(id);

    await api.setMyCommands(localizedCommands(i18n, role), { scope: { type: 'chat', chat_id: id } });
  }

  return {
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

      for (const admin of users.admins()) {
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
