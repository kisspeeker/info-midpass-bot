import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateBackupDocument } from '../tgcloud/lib/core/backup-format.js';
import {
  BACKUP_MAX_BYTES,
  BACKUP_RESTORE_BATCH_SIZE,
  BACKUP_TABLE_NAMES,
} from '../tgcloud/lib/core/constants.js';
import { tgcloudCliArgs } from './lib/tgcloud-cli.mjs';

const APPLY_FLAG = '--apply';
const args = process.argv.slice(2);
const apply = args.includes(APPLY_FLAG);
const sourceArg = args.find((arg) => arg !== APPLY_FLAG);

if (!sourceArg) {
  throw new Error('Usage: node scripts/restore-tgcloud-db.mjs /path/to/backup.json [--apply]');
}

const sourcePath = resolve(sourceArg);
const fileSize = statSync(sourcePath).size;

if (fileSize > BACKUP_MAX_BYTES) {
  throw new Error('TgCloud backup is too large');
}

const backup = validateBackupDocument(JSON.parse(readFileSync(sourcePath, 'utf8')));
const counts = Object.fromEntries(BACKUP_TABLE_NAMES.map((name) => [
  name,
  backup.tables[name].length,
]));

console.log(JSON.stringify({
  backup: sourcePath,
  createdAt: backup.createdAt,
  counts,
  apply,
}));

if (apply) {
  for (const table of BACKUP_TABLE_NAMES) {
    restoreTable(table, backup.tables[table]);
  }

  execFileSync(process.execPath, tgcloudCliArgs(
    'run',
    'endpoints/setup',
    JSON.stringify({ action: 'databaseStats' }),
  ), { stdio: 'inherit' });
}

function restoreTable(table, rows) {
  for (let offset = 0; offset < rows.length; offset += BACKUP_RESTORE_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BACKUP_RESTORE_BATCH_SIZE);
    const batchNumber = Math.floor(offset / BACKUP_RESTORE_BATCH_SIZE) + 1;

    try {
      execFileSync(process.execPath, tgcloudCliArgs(
        'run',
        'endpoints/setup',
        JSON.stringify({ action: 'restoreBackup', table, rows: batch }),
      ), { stdio: 'pipe' });
      console.log(JSON.stringify({ restoredTable: table, restoredBatch: batchNumber }));
    } catch {
      throw new Error(`Failed to restore ${table} batch ${batchNumber}`);
    }
  }
}
