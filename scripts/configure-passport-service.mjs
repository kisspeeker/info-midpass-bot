import { spawnSync } from 'node:child_process';

import { tgcloudCliArgs } from './lib/tgcloud-cli.mjs';

const BASIC_AUTHORIZATION_PATTERN = /Basic\s+[A-Za-z0-9+/]+={0,2}/g;
const AUTHORIZATION_FIELD_PATTERN = /authorization:'[^']*'/g;

const input = JSON.stringify({
  action: 'configurePassportService',
  baseUrl: process.env.PASSPORT_SERVICE_URL,
  authorization: process.env.PASSPORT_SERVICE_AUTHORIZATION,
});

const result = spawnSync(
  process.execPath,
  tgcloudCliArgs('run', 'endpoints/setup', input),
  { encoding: 'utf8' },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  const output = `${result.stderr ?? ''}${result.stdout ?? ''}`;

  process.stderr.write(
    output.replace(BASIC_AUTHORIZATION_PATTERN, 'Basic [REDACTED]')
      .replace(AUTHORIZATION_FIELD_PATTERN, 'authorization:\'[REDACTED]\'')
      || 'tgcloud setup failed\n',
  );
}

process.exitCode = result.status ?? 1;
