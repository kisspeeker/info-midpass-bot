import { CALLBACK_ACTION } from '../../core/constants.js';
import { isSupportPrompt } from '../../i18n/index.js';
import {
  forwardSupportReply,
  getSupportReplyTarget,
  requestSupportReply,
} from './admin.js';
import { forwardSupportMessage } from './user.js';
import { ROLE } from '../access.js';

export const supportMessageRoutes = [
  {
    match: (ctx) => getSupportReplyTarget(ctx.replyToText),
    role: ROLE.ADMIN,
    async handle(ctx, route) {
      await forwardSupportReply(ctx, {
        telegramUserId: route.match,
        services: route.services,
      });
    },
  },
  {
    match: (ctx) => ctx.text.split('@')[0] === '/support',
    async handle(ctx) {
      await ctx.reply(ctx.i18n.t('support.prompt'), {
        reply_markup: { force_reply: true },
      });
    },
  },
  {
    match: (ctx) => isSupportPrompt(ctx.replyToText),
    async handle(ctx, route) {
      await forwardSupportMessage(ctx, route.services);
    },
  },
];

export const supportCallbackRoutes = [{
  action: CALLBACK_ACTION.SUPPORT,
  role: ROLE.ADMIN,
  async handle(ctx, route) {
    await requestSupportReply(ctx, Number(route.value));
  },
}];
