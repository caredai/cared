import type { InferSelectModel } from 'drizzle-orm'
import { index, integer, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps } from './utils'

export const Mem0History = pgTable(
  'mem0_history',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('mem0h')),
    memoryId: text().notNull(),
    previousValue: text(),
    newValue: text(),
    action: text().notNull(),
    ...timestamps,
    isDeleted: integer().default(0),
  },
  (table) => [
    index().on(table.memoryId),
  ],
)

export type Mem0History = InferSelectModel<typeof Mem0History>
