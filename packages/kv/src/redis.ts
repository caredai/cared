import type {
  RedisClientType,
  RedisClusterType,
  RedisDefaultModules,
  RedisFunctions,
  RedisScripts,
  RedisSentinelType,
  TypeMapping,
} from 'redis'
import { BasicClientSideCache, createClient, createCluster, createSentinel } from 'redis'

import { KV } from './base'
import { env } from './env'

export type RedisClient =
  | RedisClientType<RedisDefaultModules, RedisFunctions, RedisScripts, 3, TypeMapping>
  | RedisClusterType<RedisDefaultModules, RedisFunctions, RedisScripts, 3, TypeMapping>
  | RedisSentinelType<RedisDefaultModules, RedisFunctions, RedisScripts, 3, TypeMapping>

let redisClient: Promise<RedisClient> | undefined

export async function getRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    const cache = new BasicClientSideCache({
      ttl: 0,
      maxEntries: 100000,
      evictPolicy: 'LRU',
    })

    if (env.REDIS_CLUSTER_ENABLED) {
      redisClient = createCluster<
        RedisDefaultModules,
        RedisFunctions,
        RedisScripts,
        3,
        TypeMapping
      >({
        rootNodes: env.REDIS_CLUSTER_NODES!.map((node) => ({
          url: `redis://${node}`,
        })),
        defaults: {
          username: env.REDIS_USERNAME,
          password: env.REDIS_PASSWORD,
          disableOfflineQueue: true,
        },
        RESP: 3,
        useReplicas: true,
        clientSideCache: cache,
      })
        .on('error', (err) => console.error('Redis Cluster Error', err))
        .connect()
    } else if (env.REDIS_SENTINEL_ENABLED) {
      redisClient = createSentinel<
        RedisDefaultModules,
        RedisFunctions,
        RedisScripts,
        3,
        TypeMapping
      >({
        name: env.REDIS_SENTINEL_MASTER_NAME,
        sentinelRootNodes: env.REDIS_SENTINEL_NODES!.map(([host, port]) => ({
          host: host!,
          port: Number(port!),
        })),
        RESP: 3,
        clientSideCache: cache,
      })
        .on('error', (err) => console.error('Redis Sentinel Error', err))
        .connect()
    } else {
      redisClient = createClient<
        RedisDefaultModules,
        RedisFunctions,
        RedisScripts,
        3,
        TypeMapping
      >({
        url: `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}/0`,
        RESP: 3,
        clientSideCache: cache,
        disableOfflineQueue: true,
      })
        .on('error', (err) => console.log('Redis Client Error', err))
        .connect()
    }
  }
  return redisClient
}

export class RedisKV extends KV {
  constructor(namespace: string) {
    super(namespace)
  }

  async get(key: string): Promise<string | null> {
    const client = await getRedisClient()
    return await client.get(this.key(key))
  }

  async getex(
    key: string,
    opts: {
      ex?: number
      px?: number
      exat?: number
      pxat?: number
      persist?: boolean
    },
  ): Promise<string | null> {
    const client = await getRedisClient()
    return await client.getEx(
      this.key(key),
      typeof opts.ex === 'number'
        ? {
            type: 'EX',
            value: opts.ex,
          }
        : typeof opts.px === 'number'
          ? {
              type: 'PX',
              value: opts.px,
            }
          : typeof opts.exat === 'number'
            ? {
                type: 'EXAT',
                value: opts.exat,
              }
            : typeof opts.pxat === 'number'
              ? {
                  type: 'PXAT',
                  value: opts.pxat,
                }
              : {
                  type: 'PERSIST',
                },
    )
  }

  async set(
    key: string,
    value: string,
    opts?:
      | {
          ex?: number
          px?: number
          exat?: number
          pxat?: number
          nx?: true
          xx?: true
          keepTtl?: true
        }
      | number,
  ): Promise<void> {
    const client = await getRedisClient()
    await client.set(this.key(key), value, {
      expiration:
        typeof opts === 'number'
          ? {
              type: 'EX',
              value: opts,
            }
          : typeof opts?.ex === 'number'
            ? {
                type: 'EX',
                value: opts.ex,
              }
            : typeof opts?.px === 'number'
              ? {
                  type: 'PX',
                  value: opts.px,
                }
              : typeof opts?.exat === 'number'
                ? {
                    type: 'EXAT',
                    value: opts.exat,
                  }
                : typeof opts?.pxat === 'number'
                  ? {
                      type: 'PXAT',
                      value: opts.pxat,
                    }
                  : opts?.keepTtl
                    ? {
                        type: 'KEEPTTL',
                      }
                    : undefined,
    })
  }

  async delete(key: string): Promise<void> {
    const client = await getRedisClient()
    await client.del(this.key(key))
  }

  async batchDelete(...keys: string[]): Promise<void> {
    const client = await getRedisClient()
    await client.del(keys.map((key) => this.key(key)))
  }

  async eval(
    script: { script: string; hash: string },
    keys: string[],
    args: string[],
  ): Promise<unknown> {
    const client = await getRedisClient()

    keys = keys.map((k) => this.key(k))

    try {
      return await client.evalSha(script.hash, { keys, arguments: args })
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      if (`${error}`.includes('NOSCRIPT')) {
        return await client.eval(script.script, { keys, arguments: args })
      }
      throw error
    }
  }
}

export async function sha1(str: string) {
  const buffer = new TextEncoder().encode(str)
  const digest = await crypto.subtle.digest('SHA-1', buffer)

  // Convert digest to hex string
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
}
