import type { Context } from 'grammy';
import type { Services, I18n } from './index.js';

export type BotContext = Context & {
  services: Services;
  i18n: I18n;
  syncCommands: () => Promise<void>;
};
