import { sql } from 'drizzle-orm'
import { pgEnum, timestamp } from 'drizzle-orm/pg-core'

export const timestamps = {
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'date' }).$onUpdateFn(() => sql`now()`),
}

export const visibilityEnumValues = ['public', 'private'] as const
export const visibilityEnum = pgEnum('visibility', visibilityEnumValues)
