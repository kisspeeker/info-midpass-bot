/**
 * Repository contracts: methods return Promises, records are plain objects,
 * absent records are null, lists are arrays, mutations return void unless noted.
 * users.create and subscriptions.create return whether a row was inserted.
 * Failures are RepositoryError with a stable code; driver errors never escape.
 *
 * users: getById(id), create(user), update(id, values), saveRole(id, role),
 *        listByRole(role), claimCooldown({id, field, now, cutoff}) -> boolean, remove(id).
 * passports: getById(uid), listSubscribed(), save(order), update(uid, values),
 *            removeStale({uid, before}) -> boolean. Deletes only old orders without a saved status.
 * subscriptions: getById(userId, uid), countByUser(userId) -> number,
 *        listByUser(userId), listByPassport(uid), create({userId, order}), remove(userId, uid).
 *        create/remove atomically persist the relationship and clean orphan orders.
 * maintenance: getStats(), clear() -> counts. Clear is atomic.
 *
 * Passport boolean fields use boolean|null, timestamps use Unix seconds.
 * Implementations may use SQLite, PostgreSQL or in-memory storage.
 */
export class RepositoryError extends Error {
  constructor(code, cause) {
    super('Repository operation failed', { cause });
    this.name = 'RepositoryError';
    this.code = code;
  }
}
