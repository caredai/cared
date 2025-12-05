import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { MigrationMeta } from 'drizzle-orm/migrator'
import { readMigrationFiles } from 'drizzle-orm/migrator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const migrations: MigrationMeta[] = readMigrationFiles({
  migrationsFolder: path.resolve(__dirname, '../src/migrations'),
})

fs.writeFileSync(
  path.resolve(__dirname, '../src/migrations.json'),
  JSON.stringify(migrations, null, 2),
)
