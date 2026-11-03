import { Composer } from 'grammy';
import { conversations } from '@grammyjs/conversations';

import { createTelegramApi } from '../api/telegram.js';

import { menu, showMenu } from './menu.js';
import { about } from './about.js';
import { faq } from './faq.js';
import { admin } from './admin.js';
import { account } from './account.js';
import { cryptoDonation } from './crypto-donation.js';
import { subscriptions } from './subscriptions.js';
import { passport } from './passport/index.js';
import { support } from './support/index.js';

export const composer = new Composer();

composer.use(conversations({
  plugins: [(ctx, next) => {
    createTelegramApi({ api: ctx.api });

    return next();
  }],
}));
composer.use(async (ctx, next) => {
  if (ctx.has('message:entities:bot_command') || ctx.callbackQuery) {
    await ctx.conversation.exitAll();
  }

  try {
    await next();
  } finally {
    if (ctx.callbackQuery && !ctx.callbackQueryAnswered) {
      await ctx.answerCallbackQuery();
    }
  }
});
composer.use(menu, about, faq, admin, account, cryptoDonation, subscriptions, passport, support);
composer.on('callback_query:data', (ctx) => ctx.reply(ctx.t('unavailable')));
composer.on('message', showMenu);
