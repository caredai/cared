import type { LibSQLSession } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'

import type { Db } from './client'
import { getDb } from './client'
import migrations from './migrations.json'

export async function migrateDb({
  db: maybeDb,
  url,
  group,
}:
  | {
      db: Db
      url?: never
      group?: never
    }
  | {
      db?: never
      url: string
      group: string
    }) {
  const db = maybeDb ?? getDb({ url, group })
  const session = (db as any).session as LibSQLSession<Record<string, unknown>, any>

  const migrationsTable = '__drizzle_migrations'
  const migrationTableCreate = sql`
		CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at numeric
		)
	`
  await session.run(migrationTableCreate)
  const dbMigrations = await db.values(
    sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`,
  )
  const lastDbMigration = dbMigrations[0] ?? void 0
  const statementToBatch = []
  for (const migration of migrations) {
    if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
      for (const stmt of migration.sql) {
        statementToBatch.push(db.run(sql.raw(stmt)))
      }
      statementToBatch.push(
        db.run(
          sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`,
        ),
      )
    }
  }
  await session.migrate(statementToBatch)
}
