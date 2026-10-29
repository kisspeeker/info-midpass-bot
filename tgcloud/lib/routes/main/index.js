import { accountCallbackRoutes, accountMessageRoutes } from './account.js';
import { adminCallbackRoutes, adminMessageRoutes } from './admin.js';
import { cryptoCallbackRoutes, cryptoMessageRoutes } from './crypto.js';
import { faqCallbackRoutes } from './faq.js';
import { languageCallbackRoutes } from './language.js';
import { menuCallbackRoutes, menuMessageRoutes } from './menu.js';
import { subscriptionsCallbackRoutes } from './subscriptions.js';

export const mainMessageRoutes = [
  ...adminMessageRoutes,
  ...cryptoMessageRoutes,
  ...accountMessageRoutes,
  ...menuMessageRoutes,
];

export const mainCallbackRoutes = [
  ...adminCallbackRoutes,
  ...accountCallbackRoutes,
  ...cryptoCallbackRoutes,
  ...faqCallbackRoutes,
  ...languageCallbackRoutes,
  ...menuCallbackRoutes,
  ...subscriptionsCallbackRoutes,
];
