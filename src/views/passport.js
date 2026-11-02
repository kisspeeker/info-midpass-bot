import { Composer } from 'grammy';

import { CALLBACK_ACTION, PASSPORT_TYPE } from '../config.js';
import { callbackPattern } from '../lib/callback-data.js';
import { createI18n, passportContextFromPrompt } from '../i18n/index.js';
import { showPassportResult } from './passport-status.js';
import { passportUidFromText } from '../lib/passport-uid.js';
import { showMainMenu } from './home.js';
import { botReplyText } from '../lib/telegram.js';

/** @type {import('grammy').Composer<import('../types/telegram.js').BotContext>} */
export const passport = new Composer();

passport.on('message', trackPassportFromPrompt);
passport.callbackQuery(callbackPattern(CALLBACK_ACTION.PASSPORT), requestPassportUid);

async function trackPassportFromPrompt(ctx, next) {
  const prompt = passportContextFromPrompt(botReplyText(ctx));

  if (!prompt) {
    return next();
  }

  const result = await ctx.services.passports.track(ctx.from.id, {
    type: prompt.type,
    uid: passportUidFromText(ctx.msg?.text, prompt.type),
  });

  await showPassportResult({ ctx, result, i18n: createI18n(prompt.locale) });
}

async function requestPassportUid(ctx) {
  const type = ctx.match[1];

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
