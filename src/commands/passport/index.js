import { Composer, InlineKeyboard } from 'grammy';
import { createConversation } from '@grammyjs/conversations';

import { PASSPORT_TYPE } from '../../constants.js';
import { createI18n } from '../../i18n/index.js';
import { showPassportResult } from './message.js';
import { passportUidFromText } from './uid.js';

export const passport = new Composer();

async function trackPassport(conversation, ctx, { type, locale }) {
  const i18n = createI18n(locale);
  const keyboard = new InlineKeyboard().text(i18n.t('menu.back'), 'menu');

  await ctx.reply(i18n.passportPrompt(type), { reply_markup: keyboard });

  const answer = await conversation.waitFor('message:text', {
    otherwise: (ctx) => ctx.reply(i18n.t('passport.fetchFailed')),
  });
  const uid = passportUidFromText(answer.message.text, type);
  const result = await conversation.external((ctx) => ctx.services.passports.track(ctx.from.id, { type, uid }));

  await showPassportResult({ ctx: answer, result, i18n });
}

export function showPassport(ctx) {
  const keyboard = ctx.keyboard();

  for (const type of Object.values(PASSPORT_TYPE)) {
    keyboard.text(ctx.i18n.passportLabel(type), `passport:${type}`).row();
  }

  keyboard.text(ctx.t('menu.back'), 'menu');

  return ctx.screen(ctx.t('passport.chooseType'), keyboard);
}

passport.use(createConversation(trackPassport));
passport.callbackQuery('passport', showPassport);
passport.callbackQuery(/^passport:(LEGACY_TYPE|BIOMETRIC)$/, (ctx) => ctx.conversation.enter('trackPassport', {
  type: ctx.match[1], locale: ctx.i18n.locale,
}));
