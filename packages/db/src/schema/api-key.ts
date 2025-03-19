import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, primaryKey, text, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { App } from './app'
import { timestamps, timestampsIndices, timestampsOmits } from './utils'

export const ApiKey = pgTable(
  'api_key',
  {
    appId: text()
      .notNull()
      .references(() => App.id),
    hash: varchar({ length: 255 }).notNull(),
    // encrypted api key
    key: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.appId] }),
    index().on(table.hash),
    ...timestampsIndices(table),
  ],
)

export type ApiKey = InferSelectModel<typeof ApiKey>
