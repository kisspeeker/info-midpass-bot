export const ROLE = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

export const ROLE_LEVEL = Object.freeze({
  [ROLE.USER]: 0,
  [ROLE.ADMIN]: 1,
});
