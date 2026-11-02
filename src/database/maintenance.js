export function createMaintenanceRepository(sqlite) {
  function getStats() {
    return sqlite.prepare(`SELECT
      (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM orders) AS orders,
      (SELECT count(*) FROM subscriptions) AS subscriptions`).get();
  }

  return {
    getStats,
    clear() {
      return sqlite.transaction(() => {
        const counts = getStats();

        sqlite.exec('DELETE FROM subscriptions; DELETE FROM orders; DELETE FROM users;');

        return counts;
      })();
    },
  };
}
