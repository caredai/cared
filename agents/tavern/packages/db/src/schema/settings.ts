import type { Settings } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import { timestamps, timestampsIndices } from '@cared/sdk'

import { user } from './auth'

export const UserSettings = pgTable(
  'user_settings',
  {
    userId: text()
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    settings: jsonb().$type<Settings>().notNull(),
    ...timestamps,
  },
  (table) => [
    ...timestampsIndices(table),
  ],
)

export type UserSettings = InferSelectModel<typeof UserSettings>
