import { db } from 'sdk';
import { eq } from 'sdk/db';

import { settings } from '../../schema.js';

export async function getSetting(key) {
  const setting = await db.select().from(settings).where(eq(settings.key, key)).get();

  return setting?.value ?? null;
}

export async function saveSetting(key, value) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({
    target: settings.key,
    set: { value },
  }).run();
}

export async function deleteSetting(key) {
  await db.delete(settings).where(eq(settings.key, key)).run();
}
