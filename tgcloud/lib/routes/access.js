import { ROLE_LEVEL } from '../core/roles.js';
import { getUserRole } from '../repository/users.js';

export { ROLE } from '../core/roles.js';

const roleChecks = new WeakMap();

export async function hasRole(ctx, role) {
  if (!role) {
    return true;
  }

  if (!Object.hasOwn(ROLE_LEVEL, role)) {
    throw new Error(`Unknown role: ${role}`);
  }

  if (!roleChecks.has(ctx)) {
    roleChecks.set(ctx, getUserRole(ctx.from.id));
  }

  const userRole = await roleChecks.get(ctx);

  return Object.hasOwn(ROLE_LEVEL, userRole)
    && ROLE_LEVEL[userRole] >= ROLE_LEVEL[role];
}

export async function filterByRole(ctx, items) {
  const visible = [];

  for (const item of items) {
    if (await hasRole(ctx, item.role)) {
      visible.push(item);
    }
  }

  return visible;
}
