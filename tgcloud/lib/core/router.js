import { parseCallbackData } from './callback-data.js';
import { telegram } from './telegram.js';
import { createI18n } from '../i18n/index.js';
import { ensureUser } from '../repository/users.js';
import { dispatchCallback, dispatchMessage } from '../routes/index.js';

const DEFAULT_SERVICES = { telegram, skipCooldown: false };

export async function routeMessage(ctx, services = DEFAULT_SERVICES) {
  await registerUser(ctx);
  await dispatchMessage(ctx, services);
}

export async function routeCallback(ctx, services = DEFAULT_SERVICES) {
  await registerUser(ctx);

  const callback = parseCallbackData(ctx.text);

  if (!callback) {
    await ctx.answer();

    return;
  }

  try {
    await dispatchCallback(ctx, { callback, services });
  } finally {
    await ctx.answer();
  }
}

async function registerUser(ctx) {
  ctx.i18n = createI18n(await ensureUser(ctx.from.id, ctx.i18n.locale));
}
