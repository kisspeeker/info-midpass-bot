import { MAX_SUBSCRIPTIONS_PER_USER } from '../../core/constants.js';
import { logger } from '../../core/logger.js';
import { unixTimeNow } from '../../helpers/time.js';
import { findPassport, savePassport } from '../../repository/passports.js';
import {
  addSubscription,
  countSubscriptions,
  findSubscription,
  removeOrderWithoutSubscribers,
  removeSubscription,
} from '../../repository/subscriptions.js';
import { fetchPassport } from '../api/index.js';
import { sendPassportStatus } from '../status/index.js';

export async function trackPassport(ctx, input) {
  const {
    type,
    uid,
    i18n,
  } = input;
  const telegramUserId = ctx.from.id;

  try {
    if (await findSubscription(telegramUserId, uid)) {
      const order = await findPassport(uid);

      if (!order) {
        await removeSubscription(telegramUserId, uid);
      } else {
        await sendPassportStatus(ctx, {
          i18n,
          order,
          prefix: i18n.t('subscriptions.alreadyTracked'),
        });

        return;
      }
    }

    if (await countSubscriptions(telegramUserId) >= MAX_SUBSCRIPTIONS_PER_USER) {
      await ctx.reply(i18n.t('subscriptions.limit', MAX_SUBSCRIPTIONS_PER_USER));

      return;
    }

    const passport = await fetchPassport({
      type,
      uid,
      allowPending: true,
    });
    const checkedAt = unixTimeNow();
    const order = { uid, type, ...passport, checkedAt };

    await savePassport(order);
    try {
      await addSubscription(telegramUserId, uid);
    } catch (error) {
      await removeOrderWithoutSubscribers(uid);

      throw error;
    }

    await sendPassportStatus(ctx, {
      i18n,
      order,
      prefix: i18n.t('passport.added'),
    });
  } catch (error) {
    logger.error('passport_tracking_failed', error, {
      type,
      uid,
    });

    await ctx.reply(i18n.t('passport.fetchFailed'));
  }
}
