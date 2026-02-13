import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    CLOUDFLARE_WORKERS_KV_URL: z.string().url().optional(),
    CLOUDFLARE_WORKERS_KV_API_TOKEN: z.string().min(1).optional(),

    REDIS_USERNAME: z.string().default('default'),
    REDIS_PASSWORD: z.string().optional(),
    // Single Redis instance
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.string().default('6379'),
    // Redis Cluster
    REDIS_CLUSTER_ENABLED: z.stringbool().optional(),
    // redis-node1:6379,redis-node2:6379,redis-node3:6379,redis-node4:6379,redis-node5:6379,redis-node6:6379
    REDIS_CLUSTER_NODES: z.string().transform((s) =>
      s
        .split(',')
        .map((s) =>
          s
            .trim()
            .split(':')
            .map((s) => s.trim())
            .filter(Boolean),
        )
        .filter((pair) => pair.length === 2)
        .map((pair) => pair.join(':')),
    ).optional(),
    // Redis Sentinel
    REDIS_SENTINEL_ENABLED: z.stringbool().optional(),
    // sentinel1:26379,sentinel2:26379,sentinel3:26379
    REDIS_SENTINEL_NODES: z.string().transform((s) =>
      s
        .split(',')
        .map((s) =>
          s
            .trim()
            .split(':')
            .map((s) => s.trim())
            .filter(Boolean),
        )
        .filter((pair) => pair.length === 2),
    ).optional(),
    REDIS_SENTINEL_MASTER_NAME: z.string().default('mymaster'),

    NODE_ENV: z.enum(['development', 'production']).optional(),
  },

  clientPrefix: 'VITE_',

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `VITE_`.
   */
  client: {},

  runtimeEnv: Object.assign({}, process.env, import.meta.env),

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
