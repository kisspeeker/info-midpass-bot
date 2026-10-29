import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  BACKUP_MAX_BYTES,
  BACKUP_OUTPUT_PREFIX,
} from '../tgcloud/lib/core/constants.js';
import { validateBackupDocument } from '../tgcloud/lib/core/backup-format.js';
import { tgcloudCliArgs } from './lib/tgcloud-cli.mjs';

process.umask(0o077);

const targetPath = resolve(process.argv[2] ?? '.backup/tgcloud.json');
const temporaryPath = `${targetPath}.${process.pid}.tmp`;
const data = readBackup();

mkdirSync(dirname(targetPath), { recursive: true, mode: 0o700 });
rmSync(temporaryPath, { force: true });

try {
  writeFileSync(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });
  chmodSync(temporaryPath, 0o600);
  renameSync(temporaryPath, targetPath);
  console.log(JSON.stringify({
    backup: targetPath,
    counts: Object.fromEntries(
      Object.entries(data.tables).map(([name, rows]) => [name, rows.length]),
    ),
  }));
} catch (error) {
  rmSync(temporaryPath, { force: true });
  throw error;
}

function readBackup() {
  let output;

  try {
    output = execFileSync(process.execPath, tgcloudCliArgs(
      '--no-pager',
      'run',
      'endpoints/backup',
    ), {
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      maxBuffer: BACKUP_MAX_BYTES,
    });
  } catch {
    throw new Error('TgCloud backup request failed');
  }

  const marker = `< ${BACKUP_OUTPUT_PREFIX}`;
  const line = output.split('\n').find((value) => value.startsWith(marker));

  if (!line) {
    throw new Error('Missing tgcloud backup response');
  }

  const data = JSON.parse(line.slice(marker.length).replace(/\s+\d+ms$/, ''));

  return validateBackupDocument(data);
}
