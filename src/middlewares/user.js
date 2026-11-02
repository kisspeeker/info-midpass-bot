import { createI18n, localeFrom } from '../i18n/index.js';

/** @typedef {import('../types/telegram.js').BotContext} BotContext */

/**
 * @param {import('../types/index.js').Services} services
 * @param {{configureChat: (id: number, locale?: import('../types/index.js').Locale) => Promise<void>}} profile
 * @returns {import('grammy').Middleware<BotContext>}
 */
export function userContext(services, profile) {
  return async (ctx, next) => {
    ctx.services = services;
    ctx.i18n = createI18n(await services.users.register(ctx.from.id, localeFrom(ctx.from.language_code)));
    ctx.syncCommands = () => profile.configureChat(ctx.from.id, ctx.i18n.locale);
    await next();
  };
}
