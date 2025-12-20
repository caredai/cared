import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, text, unique } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account } from './auth'

export const Graph = pgTable(
  'graph',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId('gph')),
    name: text().notNull(),
    key: text().unique().notNull(), // graph name in graph db
    accountId: text().references(() => Account.id),
    ...timestamps,
  },
  (table) => [
    index().on(table.key),
    unique().on(table.accountId, table.name),
    ...timestampsIndices(table),
  ],
)

export type Graph = InferSelectModel<typeof Graph>
