import { Composer } from 'grammy';

export const about = new Composer();

export function showAbout(ctx) {
  const keyboard = ctx.keyboard().text(ctx.t('menu.back'), 'menu');

  return ctx.screen(ctx.t('about.text'), keyboard, { parse_mode: 'HTML' });
}

about.callbackQuery(['about', 'about:open', 'faq:statuses'], showAbout);
