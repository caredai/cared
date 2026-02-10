import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account } from './auth-alias'

export const SbBucket = pgTable(
  'sb_bucket',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('sbbucket')),
    accountId: text()
      .notNull()
      .references(() => Account.id),
    name: text().notNull(),
    location: text().notNull(), // storage location
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    ...timestampsIndices(table),
  ],
)

export type SbBucket = InferSelectModel<typeof SbBucket>
