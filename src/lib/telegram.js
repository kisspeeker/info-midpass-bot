export function showMessage({ ctx, text, extra = {} }) {
  return ctx.callbackQuery
    ? ctx.editMessageText(text, extra)
    : ctx.reply(text, extra);
}

export function botReplyText(ctx) {
  const reply = ctx.msg?.reply_to_message;

  return reply?.from?.id === ctx.me.id ? reply.text : undefined;
}
