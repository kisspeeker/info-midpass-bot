import { Composer } from 'grammy';

export const faq = new Composer();

export function showFaq(ctx) {
  const keyboard = ctx.keyboard()
    .text(ctx.t('commands.crypto'), 'crypto').row()
    .text(ctx.t('menu.back'), 'menu');

  return ctx.screen(ctx.t('faq.usage'), keyboard, { parse_mode: 'HTML' });
}

faq.callbackQuery(['faq', 'faq:usage', 'faq:open'], showFaq);
