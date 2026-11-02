import { createUsersRepository } from './users.js';
import { createPassportsRepository } from './passports.js';
import { createSubscriptionsRepository } from './subscriptions.js';
import { createMaintenanceRepository } from './maintenance.js';
import { RepositoryError } from './contracts.js';

/** @param {import('better-sqlite3').Database} sqlite @returns {import('../types/index.js').Repositories} */
export function createRepositories(sqlite) {
  const passports = createPassportsRepository(sqlite);

  return {
    users: normalizeErrors(createUsersRepository(sqlite)),
    passports: normalizeErrors(passports),
    subscriptions: normalizeErrors(createSubscriptionsRepository(sqlite, passports)),
    maintenance: normalizeErrors(createMaintenanceRepository(sqlite)),
  };
}

/**
 * @template {Record<string, Function>} T
 * @param {T} repository
 * @returns {import('../types/index.js').AsyncRepository<T>}
 */
function normalizeErrors(repository) {
  return /** @type {import('../types/index.js').AsyncRepository<T>} */ (Object.fromEntries(Object.entries(repository).map(([name, operation]) => [name, async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      const code = /** @type {{code?: string}} */ (error)?.code;

      throw new RepositoryError(code?.startsWith('SQLITE_CONSTRAINT') ? 'conflict' : 'storage_unavailable', error);
    }
  }])));
}
