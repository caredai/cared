import * as dns from 'node:dns'
import type {
  RedisClusterOptions,
  RedisClusterType,
  RedisDefaultModules,
  RedisFunctions,
  RedisScripts,
} from 'redis'
import { FalkorDB } from 'falkordb'
import redis from 'redis'

import { env } from './env.js'

export async function getRedisClusterOptions() {
  const addresses = await dns.promises.resolve4(env.REDIS_CLUSTER_HEADLESS_SERVICE_HOSTNAME)
  console.log('Redis cluster nodes:', addresses.join(', '))

  if (addresses.length < 3) {
    throw new Error('Not enough Redis cluster nodes')
  }

  return {
    rootNodes: addresses.slice(0, 3).map((addr) => ({
      url: `redis://${addr}:30001`,
    })),
    defaults: {
      username: 'default',
      password: env.REDIS_PASSWORD,
    },
  } satisfies RedisClusterOptions
}

let cluster:
  | Promise<RedisClusterType<RedisDefaultModules, RedisFunctions, RedisScripts, 3>>
  | undefined

export async function getRedis() {
  cluster ??= (async () => {
    const cluster = redis.createCluster({
      ...(await getRedisClusterOptions()),
      RESP: 3,
    })
    await cluster.on('error', console.error).connect()
    return cluster
  })()
  return cluster
}

export async function getRedisClient() {
  const cluster = await getRedis()
  const client = await cluster.nodeClient(cluster.getRandomNode())
  await client.on('error', console.error).connect()
  return client
}

let falkor: Promise<FalkorDB> | undefined

export async function getFalkor() {
  falkor ??= FalkorDB.connectCluster(await getRedisClusterOptions())
  return falkor
}
