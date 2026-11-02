import { SQLITE_BUSY_TIMEOUT_MS } from '../config.js';
import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDatabase(path) {
  process.umask(0o077);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });

  const sqlite = new Database(path, { timeout: SQLITE_BUSY_TIMEOUT_MS });

  try {
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    const version = sqlite.pragma('user_version', { simple: true });

    if (version > 1) {
      throw new Error(`Unsupported database version: ${version}`);
    }

    if (version === 0) {
      sqlite.transaction(() => sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')))();
    }

    return sqlite;
  } catch (error) {
    sqlite.close();

    throw error;
  }
}
