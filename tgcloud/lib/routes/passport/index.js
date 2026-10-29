import { CALLBACK_ACTION } from '../../core/constants.js';
import { passportContextFromPrompt } from '../../i18n/index.js';
import { requestPassportUid, trackPassportFromPrompt } from './handlers.js';

export const passportMessageRoutes = [{
  match: (ctx) => passportContextFromPrompt(ctx.replyToText),
  handle(ctx, route) {
    return trackPassportFromPrompt(ctx, route.match);
  },
}];

export const passportCallbackRoutes = [{
  action: CALLBACK_ACTION.PASSPORT,
  handle: requestPassportUid,
}];
