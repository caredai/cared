import * as dns from 'node:dns'
import type {
  RedisClusterOptions,
  RedisClusterType,
  RedisDefaultModules,
  RedisFunctions,
  RedisScripts,
} from 'redis'
import redis from 'redis'

import { env } from './env.js'

const NAMESPACE = 'drizzgw'

/** Sorted set of branch keys scored by last access (minutes since epoch). */
export const ACCESS_TIME_KEY = `${NAMESPACE}::access_time`

export function authCacheKey(digest: string) {
  return `${NAMESPACE}::auth:${digest}`
}

export function lockKey(branchKey: string) {
  return `${NAMESPACE}::lock:${branchKey}`
}

export function gatewayUrlKey(branchKey: string) {
  return `${NAMESPACE}::gateway_url:${branchKey}`
}

export async function getRedisClusterOptions() {
  const addresses = await dns.promises.resolve4(env.REDIS_CLUSTER_HEADLESS_SERVICE_HOSTNAME)
  console.log('Redis cluster nodes:', addresses.join(', '))

  if (addresses.length < 3) {
    throw new Error('Not enough Redis cluster nodes')
  }

  return {
    rootNodes: addresses.slice(0, 3).map((addr) => ({
      url: `redis://${addr}:6379`,
    })),
    defaults: {
      username: 'default',
      password: env.REDIS_PASSWORD,
    },
  } satisfies RedisClusterOptions
}

type RedisCluster = RedisClusterType<RedisDefaultModules, RedisFunctions, RedisScripts, 3>

async function createAndConnectCluster(
  extraOptions: Partial<Parameters<typeof redis.createCluster>[0]> = {},
): Promise<RedisCluster> {
  const cluster = redis.createCluster({
    ...(await getRedisClusterOptions()),
    RESP: 3,
    ...extraOptions,
  })
  await cluster.on('error', console.error).connect()
  return cluster as RedisCluster
}

let cluster: Promise<RedisCluster> | undefined
let clusterWithoutCache: Promise<RedisCluster> | undefined

/** Redis cluster with client-side cache enabled (general reads/writes). */
export async function getRedis() {
  cluster ??= createAndConnectCluster({
    clientSideCache: {
      ttl: 300000, // Time-to-live in milliseconds (0 = no expiration)
      maxEntries: 10000, // Maximum entries to store (0 = unlimited)
      evictPolicy: 'LRU', // Eviction policy: "LRU" or "FIFO"
    },
  })
  return cluster
}

/** Redis cluster without client-side cache (redis locks must see live key state). */
export async function getRedisWithoutCache() {
  clusterWithoutCache ??= createAndConnectCluster()
  return clusterWithoutCache
}
