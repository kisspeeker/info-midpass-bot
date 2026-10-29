import { db } from 'sdk';
import { eq } from 'sdk/db';

import { orders } from '../../schema.js';

export async function findPassport(uid) {
  return db.select().from(orders).where(eq(orders.uid, uid)).get();
}

export async function getPassports() {
  return db.select().from(orders).all();
}

export async function savePassport(order) {
  const values = { ...order };

  delete values.uid;

  await db.insert(orders).values(order).onConflictDoUpdate({
    target: orders.uid,
    set: values,
  }).run();
}

export async function updatePassport(uid, values) {
  await db.update(orders).set(values).where(eq(orders.uid, uid)).run();
}
