import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, pgTable, text, unique } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account } from './auth-alias'

export const Neon = pgTable(
  'neon',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('neon')),
    accountId: text()
      .notNull()
      .references(() => Account.id),
    name: text().notNull(),
    isLowCost: boolean().notNull(),
    orgId: text().notNull(), // neon org id
    projectId: text().notNull(), // neon project id
    regionId: text().notNull(), // neon region id
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    unique().on(table.orgId, table.projectId),
    ...timestampsIndices(table),
  ],
)

export type Neon = InferSelectModel<typeof Neon>
