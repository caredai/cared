import type { Theme as ThemeContent } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@ownxai/sdk'

import { user } from './auth'

export const Theme = pgTable(
  'theme',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('mp')),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    theme: jsonb().$type<ThemeContent>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type Theme = InferSelectModel<typeof Theme>
