import { logger } from '../services/logger.js';

export async function loggerMiddleware(ctx, next) {
  const started = Date.now();

  try {
    await next();
  } finally {
    logger.info('update_finished', {
      updateId: ctx.update.update_id,
      durationMs: Date.now() - started,
    });
  }
}
