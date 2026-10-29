import createBackup from '../lib/core/backup.js';

export default async function runBackup(input, ctx = {}) {
  if (Object.hasOwn(ctx, 'initData')) {
    throw new Error('Backup endpoint is not available over HTTP');
  }

  return createBackup(input);
}
