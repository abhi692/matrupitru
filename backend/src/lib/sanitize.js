// Strips passwordHash before any User-shaped object (or object nesting one)
// leaves the process as an API response. Applied explicitly at each route's
// response boundary rather than via a Prisma-level hook, since some internal
// flows (login) need the hash before the response is built.
export function omitPasswordHash(obj) {
  if (Array.isArray(obj)) return obj.map(omitPasswordHash);
  if (obj instanceof Date) return obj;
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const { passwordHash, ...rest } = obj;
    for (const key of Object.keys(rest)) {
      if (rest[key] && typeof rest[key] === 'object') rest[key] = omitPasswordHash(rest[key]);
    }
    return rest;
  }
  return obj;
}
