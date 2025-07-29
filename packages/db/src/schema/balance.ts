import { index, integer, pgTable, text } from 'drizzle-orm/pg-core'

import { timestampsIndices, User } from '.'
import { generateId, timestamps } from './utils'

export const Balance = pgTable(
  'balance',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('agent')),
    userId: text()
      .notNull()
      .references(() => User.id),
    credits: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)
