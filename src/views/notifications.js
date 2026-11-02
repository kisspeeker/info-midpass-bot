import { createI18n } from '../i18n/index.js';
import { passportStatusMessage } from './passport-status.js';

export function createNotifications({ api, users }) {
  return {
    async subscriber(id, order) {
      const i18n = createI18n(await users.getLocale(id));
      const { text, extra } = passportStatusMessage({
        i18n, order, notification: true,
        prefix: i18n.t('passport.changed'), suffix: i18n.t('donations.text'),
      });

      try {
        await api.sendMessage(id, text, extra);

        return 'delivered';
      } catch (error) {
        if (error.error_code === 403) {
          return 'blocked';
        }

        throw error;
      }
    },
  };
}
