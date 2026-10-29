import pollPassports from '../lib/passports/polling/index.js';

export default async function runPolling(input, ctx = {}) {
  if (Object.hasOwn(ctx, 'initData')) {
    throw new Error('Polling endpoint is not available over HTTP');
  }

  return pollPassports(input);
}
