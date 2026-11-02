export async function telegramContext(ctx, next) {
  let answered = false;

  ctx.api.config.use((prev, method, payload, signal) => {
    if (method === 'answerCallbackQuery') {
      answered = true;
    }

    return prev(method, payload, signal);
  });

  try {
    if (ctx.chat?.type === 'private' && ctx.from && (ctx.message || ctx.callbackQuery)) {
      await next();
    }
  } finally {
    if (ctx.callbackQuery && !answered) {
      await ctx.answerCallbackQuery();
    }
  }
}
