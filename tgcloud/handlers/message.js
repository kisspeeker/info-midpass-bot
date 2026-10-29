import { createMessageContext } from '../lib/core/context.js';
import { routeMessage } from '../lib/core/router.js';

export default async function handleMessage(message) {
  const ctx = createMessageContext(message);

  if (!ctx?.isPrivate) {
    return;
  }

  await routeMessage(ctx);
}
