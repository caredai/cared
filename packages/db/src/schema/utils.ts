import { sql } from 'drizzle-orm'
import { index, pgEnum, timestamp } from 'drizzle-orm/pg-core'

export const createdAt = timestamp({ mode: 'date' }).notNull().defaultNow()
export const updatedAt = timestamp({ mode: 'date' })
  .notNull()
  .defaultNow()
  .$onUpdateFn(
    () => sql`now()`,
  )
export const timestamps = {
  createdAt,
  updatedAt,
}
export const timestampsIndices = (table: any) => [
  index().on(table.createdAt),
  index().on(table.updatedAt),
]
export const timestampsOmits = { createdAt: true as const, updatedAt: true as const }

export const visibilityEnumValues = ['public', 'private'] as const
export const visibilityEnum = pgEnum('visibility', visibilityEnumValues)

export const roleEnumValues = ['owner', 'member'] as const
export const roleEnum = pgEnum('role', roleEnumValues)
