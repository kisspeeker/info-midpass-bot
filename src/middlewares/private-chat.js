export async function privateChatMiddleware(ctx, next) {
  if (ctx.chat?.type !== 'private' || !ctx.from) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery();
    }

    return;
  }

  await next();
}
