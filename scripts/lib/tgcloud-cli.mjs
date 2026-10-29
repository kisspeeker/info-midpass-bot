import { fileURLToPath } from 'node:url';

const TGCLOUD_CLI_PATH = fileURLToPath(
  import.meta.resolve('@tgcloud/cli/bin/tgcloud.js'),
);

export function tgcloudCliArgs(...args) {
  return [TGCLOUD_CLI_PATH, ...args];
}
