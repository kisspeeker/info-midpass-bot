import { BOT_COMMANDS, DB_PATH, ROLE, shutdown, TELEGRAM_ADMIN_IDS } from './config.js';
import { openDatabase } from './database/db.js';
import { createRepositories } from './database/index.js';
import { createUserService } from './services/users.js';
import { createPassportService } from './services/passports.js';
import { createSupportService } from './services/support.js';
import { createMaintenanceService } from './services/maintenance.js';
import { createPollingService } from './services/polling.js';
import { fetchPassport } from './api/midpass.js';
import { createTelegramApi } from './api/telegram.js';
import { createProfileClient } from './api/profile.js';
import { telegramContext } from './middlewares/telegram.js';
import { userContext } from './middlewares/user.js';
import { home } from './views/home.js';
import { about } from './views/about.js';
import { faq } from './views/faq.js';
import { admin } from './views/admin.js';
import { cryptoDonation } from './views/crypto-donation.js';
import { account } from './views/account.js';
import { language } from './views/language.js';
import { subscriptions } from './views/subscriptions.js';
import { passport } from './views/passport.js';
import { support } from './views/support.js';
import { createNotifications } from './views/notifications.js';
import { createJobs } from './jobs.js';
import { logger } from './lib/logger.js';

export function createApp() {
  const api = createTelegramApi({ signal: shutdown.signal });
  const sqlite = openDatabase(DB_PATH);
  const repositories = createRepositories(sqlite);
  const users = createUserService({ users: repositories.users, logger });
  const polling = createPollingService({
    passports: repositories.passports, subscriptions: repositories.subscriptions, users, fetchPassport, logger,
    notify: createNotifications({ api, users }), signal: shutdown.signal,
  });
  const maintenance = createMaintenanceService({ maintenance: repositories.maintenance, users });
  const passports = createPassportService({
    passports: repositories.passports, subscriptions: repositories.subscriptions, users, fetchPassport, logger,
    refreshPassport: polling.refresh,
  });
  const services = { users, maintenance, passports, support: createSupportService({ users }) };
  const profile = createProfileClient({ api, users, commands: BOT_COMMANDS });

  return {
    views: { support, passport, admin, cryptoDonation, account, about, faq, language, subscriptions, home },
    middlewares: [telegramContext, userContext(services, profile)],
    jobs: createJobs({ polling }),
    async initialize() {
      for (const id of TELEGRAM_ADMIN_IDS) {
        await users.setRole(id, ROLE.ADMIN);
      }

      await profile.configure();
    },
    close: () => sqlite.close(),
  };
}
