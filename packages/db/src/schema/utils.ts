import { sql } from 'drizzle-orm'
import { pgEnum, timestamp } from 'drizzle-orm/pg-core'

export const createdAt = timestamp({ mode: 'date' }).defaultNow().notNull()
export const updatedAt = timestamp({ mode: 'date' }).$onUpdateFn(() => sql`now()`)
export const timestamps = {
  createdAt,
  updatedAt,
}

export const visibilityEnumValues = ['public', 'private'] as const
export const visibilityEnum = pgEnum('visibility', visibilityEnumValues)
