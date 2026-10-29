import { PASSPORT_TYPE } from '../../core/constants.js';
import { createI18n } from '../../i18n/index.js';
import { trackPassport } from '../../passports/tracking/index.js';
import { passportUidFromText } from '../../passports/uid.js';
import { showMainMenu } from '../main/menu.js';

export async function trackPassportFromPrompt(ctx, passport) {
  await trackPassport(ctx, {
    type: passport.type,
    uid: passportUidFromText(ctx.text, passport.type),
    i18n: createI18n(passport.locale),
  });
}

export async function requestPassportUid(ctx, route) {
  const type = route.value;

  if (!Object.values(PASSPORT_TYPE).includes(type)) {
    await showMainMenu(ctx);

    return;
  }

  await ctx.reply(ctx.i18n.passportPrompt(type), {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: ctx.i18n.t(
        type === PASSPORT_TYPE.BIOMETRIC
          ? 'passport.biometricInput'
          : 'passport.legacyInput',
      ),
    },
  });
}
