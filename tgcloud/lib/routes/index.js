import { mainCallbackRoutes, mainMessageRoutes } from './main/index.js';
import { passportCallbackRoutes, passportMessageRoutes } from './passport/index.js';
import { supportCallbackRoutes, supportMessageRoutes } from './support/index.js';
import { hasRole } from './access.js';

const messageRoutes = [
  ...supportMessageRoutes,
  ...passportMessageRoutes,
  ...mainMessageRoutes,
];

const callbackRoutes = createCallbackRoutes([
  ...supportCallbackRoutes,
  ...passportCallbackRoutes,
  ...mainCallbackRoutes,
]);

export async function dispatchMessage(ctx, services) {
  for (const route of messageRoutes) {
    const match = route.match(ctx);

    if (match === false || match == null) {
      continue;
    }

    if (!await hasRole(ctx, route.role)) {
      continue;
    }

    await route.handle(ctx, { match, services });

    return;
  }
}

export async function dispatchCallback(ctx, input) {
  const { callback, services } = input;
  const route = callbackRoutes.get(callback.action);

  if (!route || !await hasRole(ctx, route.role)) {
    return;
  }

  await route.handle(ctx, {
    value: callback.value,
    services,
  });
}

function createCallbackRoutes(routes) {
  const result = new Map();

  for (const route of routes) {
    if (result.has(route.action)) {
      throw new Error(`Duplicate callback action: ${route.action}`);
    }

    result.set(route.action, route);
  }

  return result;
}
