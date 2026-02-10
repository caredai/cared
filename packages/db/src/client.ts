import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import { drizzle as _drizzlePostgresJs } from 'drizzle-orm/postgres-js'
import { Pool } from 'pg'

import { env } from './env'
import * as schema from './schema'

export type Database = PostgresJsDatabase<typeof schema> | NodePgDatabase<typeof schema>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
})

export const db: Database = drizzleNodePg({
  client: pool,
  schema,
  casing: 'camelCase',
  logger: env.NODE_ENV === 'development',
})
