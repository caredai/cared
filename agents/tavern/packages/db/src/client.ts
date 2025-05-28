import * as process from 'node:process'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { VercelPgDatabase } from 'drizzle-orm/vercel-postgres/driver'
import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres'

import * as schema from './schema'

export type DB = PostgresJsDatabase<typeof schema> | VercelPgDatabase<typeof schema>

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let db: DB
}

function createDB() {
  return process.env.POSTGRES_URL &&
    ([
      '127.0.0.1',
      'localhost',
    ].includes(new URL(process.env.POSTGRES_URL).hostname) ||
      process.env.POSTGRES_URL.includes('supabase') ||
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.POSTGRES_DONOT_USE_VERCEL_CLIENT)
    ? drizzle({
        connection: {
          url: process.env.POSTGRES_URL,
        },
        schema,
        casing: 'camelCase',
        logger: process.env.NODE_ENV === 'development',
      })
    : drizzleVercel({
        client: sql,
        schema,
        casing: 'camelCase',
        logger: process.env.NODE_ENV === 'development',
      })
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (process.env.NODE_ENV === 'development' && !globalThis.db) {
  globalThis.db = createDB()
}

// https://github.com/drizzle-team/drizzle-orm/issues/928#issuecomment-1739105895
export const db: DB = process.env.NODE_ENV === 'development' ? globalThis.db : createDB()

export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0]
