/**
 * @param {{users: import('../types/index.js').UserService}} dependencies
 * @returns {import('../types/index.js').Services['support']}
 */
export function createSupportService({ users }) {
  return {
    async request(userId) {
      const retryAfter = await users.claimSupportRequest(userId);

      return retryAfter
        ? { status: 'retry', retryAfter }
        : { status: 'ready', admins: await users.admins() };
    },
  };
}
