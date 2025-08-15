import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { VercelPgDatabase } from 'drizzle-orm/vercel-postgres/driver'
import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres'

import { env } from './env'
import * as schema from './schema'

export type Database = PostgresJsDatabase<typeof schema> | VercelPgDatabase<typeof schema>

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let db: Database
}

function createDB() {
  return env.POSTGRES_URL &&
    ([
      '127.0.0.1',
      'localhost',
    ].includes(new URL(env.POSTGRES_URL).hostname) ||
      env.POSTGRES_URL.includes('supabase') ||
      env.POSTGRES_DONT_USE_VERCEL_CLIENT)
    ? drizzle({
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
    : drizzleVercel({
        client: sql,
        schema,
        casing: 'camelCase',
        logger: env.NODE_ENV === 'development',
      })
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (env.NODE_ENV === 'development' && !globalThis.db) {
  globalThis.db = createDB()
}

// https://github.com/drizzle-team/drizzle-orm/issues/928#issuecomment-1739105895
export const db: Database = env.NODE_ENV === 'development' ? globalThis.db : createDB()

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
