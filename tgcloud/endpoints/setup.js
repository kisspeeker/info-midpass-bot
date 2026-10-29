import setup from '../lib/core/setup/index.js';

export default async function runSetup(input, ctx = {}) {
  if (Object.hasOwn(ctx, 'initData')) {
    throw new Error('Setup endpoint is not available over HTTP');
  }

  return setup(input);
}
