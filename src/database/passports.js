export function createPassportsRepository(sqlite) {
  const columns = new Set(sqlite.prepare('PRAGMA table_info(orders)').all().map((column) => column.name));

  function getById(uid) {
    return passportRow(sqlite.prepare('SELECT * FROM orders WHERE uid = ?').get(uid)) ?? null;
  }

  function listSubscribed() {
    return sqlite.prepare(`SELECT * FROM orders
      WHERE EXISTS (SELECT 1 FROM subscriptions WHERE orderUid = orders.uid)
      ORDER BY max(lastAttemptAt, checkedAt), uid`).all().map(passportRow);
  }

  function save(order) {
    const entries = passportValues(order);
    const names = entries.map(([key]) => key);
    const updates = names.filter((key) => key !== 'uid').map((key) => `${key} = excluded.${key}`);

    sqlite.prepare(`INSERT INTO orders (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})
      ON CONFLICT (uid) DO UPDATE SET ${updates.join(', ')}`).run(...entries.map(([, value]) => value));
  }

  function update(uid, values) {
    const entries = passportValues(values).filter(([key]) => key !== 'uid');

    if (entries.length) {
      sqlite.prepare(`UPDATE orders SET ${entries.map(([key]) => `${key} = ?`).join(', ')} WHERE uid = ?`)
        .run(...entries.map(([, value]) => value), uid);
    }
  }

  function passportValues(values) {
    return Object.entries(values)
      .filter(([key]) => columns.has(key))
      .map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value ?? null]);
  }

  function removeStale({ uid, before }) {
    return sqlite.prepare(`DELETE FROM orders WHERE uid = ? AND checkedAt <= ?
      AND coalesce(statusText, '') = ''
      AND coalesce(passportStatusName, '') = ''
      AND coalesce(internalStatusName, '') = ''
      AND internalStatusPercent IS NULL`).run(uid, before).changes > 0;
  }

  return { getById, listSubscribed, save, update, removeStale };
}

export function passportRow(row) {
  if (row?.passportStatusSubscription != null) {
    row.passportStatusSubscription = Boolean(row.passportStatusSubscription);
  }

  return row;
}
