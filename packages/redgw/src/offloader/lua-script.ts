/**
 * Lua script to release a lock atomically.
 * This script checks if the lock exists and matches the expected value before deleting it.
 * Returns 1 if the lock was released, 0 if the lock doesn't exist or value doesn't match.
 *
 * @param KEYS[1] - The lock key
 * @param ARGV[1] - The expected lock value
 * @returns 1 if released, 0 otherwise
 */
export const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`

/**
 * Lua script to renew/extend a lock's expiration time atomically.
 * This script checks if the lock exists and matches the expected value before extending its TTL.
 * Returns 1 if the lock was renewed, 0 if the lock doesn't exist or value doesn't match.
 *
 * @param KEYS[1] - The lock key
 * @param ARGV[1] - The expected lock value
 * @param ARGV[2] - The TTL in seconds (as string, will be converted to number)
 * @returns 1 if renewed, 0 otherwise
 */
export const RENEW_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    redis.call("expire", KEYS[1], tonumber(ARGV[2]))
    return 1
  else
    return 0
  end
`

/**
 * Lua script to check graph status and refresh access time if needed.
 * This script checks the graph status and returns it. If the status is 'active' and
 * the last access time is more than 1 hour ago (or doesn't exist), it updates the access time.
 *
 * @param KEYS[1] - The status key (graph:status:${graph})
 * @param KEYS[2] - The access time sorted set key (graph:access_time)
 * @param ARGV[1] - The graph name
 * @param ARGV[2] - The current hours since epoch (as string, will be converted to number)
 * @returns The graph status string, or nil if status doesn't exist
 */
export const CHECK_STATUS_AND_REFRESH_ACCESS_SCRIPT = `
  local status = redis.call("get", KEYS[1])
  local currentHours = tonumber(ARGV[2])
  local lastAccessHours = redis.call("zscore", KEYS[2], ARGV[1])
  
  -- If status is active and access time needs refresh
  if status == "active" then
    if not lastAccessHours or (currentHours - tonumber(lastAccessHours)) >= 1 then
      redis.call("zadd", KEYS[2], currentHours, ARGV[1])
    end
  end
  
  return status
`
