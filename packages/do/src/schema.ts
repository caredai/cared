import type { InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const Example = sqliteTable('example', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
})

export type Example = InferSelectModel<typeof Example>
