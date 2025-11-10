import type { NeonDatabase } from 'drizzle-orm/neon-serverless'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { neonConfig, Pool as NeonPool } from '@neondatabase/serverless'
import { attachDatabasePool } from '@vercel/functions'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePostgresJs } from 'drizzle-orm/postgres-js'
import { Pool } from 'pg'
import postgresJs from 'postgres'
import ws from 'ws'

import type { Hyperdrive } from '@cloudflare/workers-types'
import { env } from './env'
import * as schema from './schema'

export type Database =
  | PostgresJsDatabase<typeof schema>
  | NodePgDatabase<typeof schema>
  | NeonDatabase<typeof schema>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

let hyperdriveConnStr: string | undefined

export function setDb(hyperdrive: Hyperdrive) {
  hyperdriveConnStr ??= hyperdrive.connectionString
}

export const db = new Proxy({} as Database, {
  get(target, prop) {
    const db = getDb()
    return db[prop as keyof Database]
  },
})

function getDb() {
  if (hyperdriveConnStr) {
    const client = postgresJs(hyperdriveConnStr, {
      // Limit the connections for the Worker request to 5 due to Workers' limits on concurrent external connections
      max: 5,
      // If you are not using array types in your Postgres schema, disable `fetch_types` to avoid an additional round-trip (unnecessary latency)
      fetch_types: false,
      prepare: true,
    })
    return drizzlePostgresJs({
      client,
      schema,
      casing: 'camelCase',
      logger: env.NODE_ENV === 'development',
    })
  }

  if (globalThis.navigator.userAgent.includes('Cloudflare-Workers')) {
    if (!env.POSTGRES_URL?.includes('neon.tech')) {
      const pool = new Pool({
        connectionString: env.POSTGRES_URL,
        // You don't want to reuse the same connection for multiple requests
        maxUses: 1,
      })
      return drizzleNodePg({
        client: pool,
        schema,
        casing: 'camelCase',
        logger: env.NODE_ENV === 'development',
      })
    } else {
      neonConfig.webSocketConstructor = ws
      neonConfig.poolQueryViaFetch = true
      const pool = new NeonPool({ connectionString: env.POSTGRES_URL })
      return drizzleNeon({
        client: pool,
        schema,
        casing: 'camelCase',
        logger: env.NODE_ENV === 'development',
      })
    }
  } else {
    return getCachedDb()
  }
}

let cachedDb: Database | undefined = undefined

function getCachedDb() {
  if (!cachedDb) {
    if (process.env.VERCEL) {
      // https://vercel.com/blog/the-real-serverless-compute-to-database-connection-problem-solved
      // https://vercel.com/guides/connection-pooling-with-functions
      const pool = new NeonPool({
        connectionString: env.POSTGRES_URL,
        idleTimeoutMillis: 5000,
        min: 1,
      })
      attachDatabasePool(pool)

      cachedDb = drizzleNeon({
        client: pool,
        schema,
        casing: 'camelCase',
        logger: env.NODE_ENV === 'development',
      })
    } else if (env.POSTGRES_URL?.includes('neon.tech')) {
      neonConfig.webSocketConstructor = ws
      neonConfig.poolQueryViaFetch = true
      const pool = new NeonPool({ connectionString: env.POSTGRES_URL })
      return drizzleNeon({
        client: pool,
        schema,
        casing: 'camelCase',
        logger: env.NODE_ENV === 'development',
      })
    } else {
      cachedDb = drizzlePostgresJs({
        connection: {
          url: env.POSTGRES_URL,
          prepare: false,
          idle_timeout: 10,
          connect_timeout: 30,
          max_lifetime: 60 * (30 + Math.random() * 30),
        },
        schema,
        casing: 'camelCase',
        logger: env.NODE_ENV === 'development',
      })
    }
  }
  return cachedDb
}
