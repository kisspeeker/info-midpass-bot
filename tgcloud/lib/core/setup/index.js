import { grantAdmin, revokeAdmin } from './admin.js';
import { configureBot } from './configuration.js';
import { importLegacy } from './legacy.js';
import { restoreBackup } from './backup.js';
import { configureSettings } from './settings.js';
import {
  clearDatabase,
  databaseStats,
  deleteUser,
} from './database.js';

const ACTIONS = Object.freeze({
  configureBot,
  configureSettings,
  grantAdmin,
  revokeAdmin,
  databaseStats,
  deleteUser,
  clearDatabase,
  importLegacy,
  restoreBackup,
});

export default async function setup(input = {}) {
  const action = Object.hasOwn(ACTIONS, input?.action)
    ? ACTIONS[input.action]
    : null;

  if (!action) {
    throw new Error('Unknown setup action');
  }

  return action(input);
}
