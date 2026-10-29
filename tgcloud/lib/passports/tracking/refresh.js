import { unixTimeNow } from '../../helpers/time.js';
import { logger } from '../../core/logger.js';
import { findPassport, updatePassport } from '../../repository/passports.js';
import { findSubscription, removeSubscription } from '../../repository/subscriptions.js';
import { claimStatusRefresh } from '../../repository/users.js';
import { fetchPassport } from '../api/index.js';
import { sendPassportStatus } from '../status/index.js';

export async function refreshPassport(ctx, input) {
  const {
    uid,
    skipCooldown = false,
    showStatusOnCooldown = false,
  } = input;
  const telegramUserId = ctx.from.id;
  const subscription = await findSubscription(telegramUserId, uid);

  if (!subscription) {
    await ctx.alert(ctx.i18n.t('subscriptions.notFound'));

    return;
  }

  const order = await findPassport(uid);

  if (!order) {
    await removeSubscription(telegramUserId, uid);
    await ctx.alert(ctx.i18n.t('passport.applicationNotFound'));

    return;
  }

  const retryAfter = await claimStatusRefresh(telegramUserId, {
    skipCooldown,
  });

  if (retryAfter) {
    await ctx.notify(ctx.i18n.t('passport.recent'));

    if (!showStatusOnCooldown) {
      return;
    }

    await sendPassportStatus(ctx, { order });

    return;
  }

  try {
    const passport = await fetchPassport({
      type: order.type,
      uid,
      allowPending: true,
    });
    const orderUpdate = { ...passport, checkedAt: unixTimeNow() };
    const updatedOrder = { ...order, ...orderUpdate };

    await updatePassport(uid, orderUpdate);
    await sendPassportStatus(ctx, {
      order: updatedOrder,
      prefix: ctx.i18n.t('passport.refreshed'),
    });
  } catch (error) {
    logger.error('passport_refresh_failed', error, {
      type: order.type,
      uid,
    });

    await ctx.alert(ctx.i18n.t('passport.refreshFailed'));
  }
}
