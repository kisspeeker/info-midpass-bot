import { createCallbackContext } from '../lib/core/context.js';
import { routeCallback } from '../lib/core/router.js';

export default async function handleCallbackQuery(callbackQuery) {
  const ctx = createCallbackContext(callbackQuery);

  if (!ctx) {
    return;
  }

  if (!ctx.isPrivate) {
    await ctx.answer();

    return;
  }

  await routeCallback(ctx);
}
