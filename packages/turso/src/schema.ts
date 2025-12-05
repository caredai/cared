import type { InferSelectModel } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { customType, integer, sqliteTable } from 'drizzle-orm/sqlite-core'

/**
 * Custom type for storing float32 arrays (vectors) as BLOB in SQLite.
 * Used for vector embeddings with configurable dimensions.
 * Converts between JavaScript number arrays and SQLite BLOB format.
 */
const float32Array = customType<{
  data: number[]
  config: { dimensions: number }
  configRequired: true
  driverData: Buffer
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer))
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`
  },
})

export const Example = sqliteTable('example', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  vector: float32Array({ dimensions: 768 }),
})

export type Example = InferSelectModel<typeof Example>
