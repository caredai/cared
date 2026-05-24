import { env } from '../env.js'
import { ACCESS_TIME_KEY, gatewayUrlKey, getRedis } from '../redis.js'
import { getMinutesSinceEpoch } from './access.js'

/** Extra TTL on cached URLs beyond the idle window (seconds). */
const GATEWAY_URL_CACHE_MARGIN_SECONDS = 90

export function gatewayUrlCacheTtlSeconds(): number {
  return env.MAX_IDLE_MINUTES * 60 + GATEWAY_URL_CACHE_MARGIN_SECONDS
}

/**
 * Whether last access is fresh enough to trust a cached gateway URL.
 * Skips cache when missing or within NEAR_IDLE_BUFFER_SECONDS of offload.
 */
export async function isAccessFreshForGatewayCache(branchKey: string): Promise<boolean> {
  const redis = await getRedis()
  const lastAccess = await redis.zScore(ACCESS_TIME_KEY, branchKey)
  if (lastAccess === null) {
    return false
  }

  const nowInSeconds = getMinutesSinceEpoch() * 60
  const idleThresholdSeconds = nowInSeconds - env.MAX_IDLE_MINUTES * 60
  const nearIdleCutoffSeconds = idleThresholdSeconds + env.NEAR_IDLE_BUFFER_SECONDS
  return lastAccess * 60 >= nearIdleCutoffSeconds
}

/** Reads the gateway URL from Redis without checking access freshness. */
export async function readGatewayUrlFromCache(branchKey: string): Promise<string | undefined> {
  const redis = await getRedis()
  const cached = await redis.get(gatewayUrlKey(branchKey))
  return cached ?? undefined
}

export async function setCachedGatewayUrl(branchKey: string, baseUrl: string): Promise<void> {
  const redis = await getRedis()
  await redis.set(gatewayUrlKey(branchKey), baseUrl, { EX: gatewayUrlCacheTtlSeconds() })
}

export async function invalidateGatewayUrlCache(branchKey: string): Promise<void> {
  const redis = await getRedis()
  await redis.del(gatewayUrlKey(branchKey))
}
