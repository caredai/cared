import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { VercelPgDatabase } from 'drizzle-orm/vercel-postgres/driver'
import { cache } from 'react'
import { sql } from '@vercel/postgres'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePostgresJs } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleVercelPg } from 'drizzle-orm/vercel-postgres'
import { Pool } from 'pg'
import postgresJs from 'postgres'

import type { Hyperdrive } from '@cloudflare/workers-types'
import { env } from './env'
import * as schema from './schema'

export type Database =
  | PostgresJsDatabase<typeof schema>
  | NodePgDatabase<typeof schema>
  | VercelPgDatabase<typeof schema>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

let hyperdriveConnStr: string | undefined

export function setDb(hyperdrive: Hyperdrive) {
  hyperdriveConnStr ??= hyperdrive.connectionString
}

export const getDb = cache(() => {
  if (hyperdriveConnStr) {
    const client = postgresJs(hyperdriveConnStr, {
      // Limit the connections for the Worker request to 5 due to Workers' limits on concurrent external connections
      max: 5,
      // If you are not using array types in your Postgres schema, disable `fetch_types` to avoid an additional round-trip (unnecessary latency)
      fetch_types: false,
    })
    return drizzlePostgresJs({
      client,
      schema,
      casing: 'camelCase',
      logger: env.NODE_ENV === 'development',
    })
  }

  if (globalThis.navigator.userAgent.includes('Cloudflare-Workers')) {
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
  } else if (process.env.VERCEL) {
    return drizzleVercelPg({
      client: sql,
      schema,
      casing: 'camelCase',
      logger: env.NODE_ENV === 'development',
    })
  } else {
    return drizzlePostgresJs({
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
})

export const db = new Proxy({} as Database, {
  get(target, prop) {
    const db = getDb()
    return db[prop as keyof Database]
  },
})
