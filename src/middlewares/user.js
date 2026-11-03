import { ROLE_LEVEL } from '../constants.js';
import { createI18n } from '../i18n/index.js';

export function createUserMiddleware(services, profile) {
  return async (ctx, next) => {
    ctx.services = services;
    ctx.user = services.users.ensure(ctx.from);
    ctx.i18n = createI18n(ctx.user.languageCode);
    ctx.can = (role = 'user') => ROLE_LEVEL[ctx.user.role] >= ROLE_LEVEL[role];
    ctx.setLocale = async (locale) => {
      services.users.setLocale(ctx.user.telegramUserId, locale);
      ctx.user.languageCode = locale;
      ctx.i18n = createI18n(locale);
      await profile.configureChat(ctx.from.id, locale);
    };
    await next();
  };
}
