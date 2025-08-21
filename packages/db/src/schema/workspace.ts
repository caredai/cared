import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

import { Organization } from './auth-alias'
import { generateId, timestamps } from './utils'

export const Workspace = pgTable(
  'workspace',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('workspace')),
    name: varchar({ length: 255 }).notNull(),
    organizationId: text()
      .notNull()
      .references(() => Organization.id),
    archived: boolean(),
    archivedAt: timestamp({
      mode: 'date',
      withTimezone: true,
    }),
    deleted: boolean(),
    deletedAt: timestamp({
      mode: 'date',
      withTimezone: true,
    }),
    ...timestamps,
  },
  (table) => [
    index().on(table.organizationId, table.deleted),
    index().on(table.archived, table.archivedAt),
    index().on(table.deleted),
  ],
)

export type Workspace = InferSelectModel<typeof Workspace>
