/**
 * Lua script to release a lock atomically.
 */
export const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`

/**
 * Lua script to renew a lock TTL atomically.
 */
export const RENEW_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    redis.call("expire", KEYS[1], tonumber(ARGV[2]))
    return 1
  else
    return 0
  end
`
