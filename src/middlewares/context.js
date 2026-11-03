import { InlineKeyboard } from 'grammy';

export async function contextMiddleware(ctx, next) {
  ctx.keyboard = () => new InlineKeyboard();
  ctx.t = (key, params) => ctx.i18n.t(key, params);
  ctx.alert = async (text) => {
    await ctx.answerCallbackQuery({ text, show_alert: true });
    ctx.callbackQueryAnswered = true;
  };
  ctx.screen = async (text, keyboard, extra = {}) => {
    if (!ctx.callbackQuery) {
      return ctx.reply(text, { ...extra, reply_markup: keyboard });
    }

    try {
      return await ctx.editMessageText(text, { ...extra, reply_markup: keyboard });
    } catch (error) {
      if (error.error_code !== 400 || !error.description?.includes('message is not modified')) {
        throw error;
      }
    }
  };
  await next();
}
