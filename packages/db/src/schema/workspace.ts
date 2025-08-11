import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, text, varchar } from 'drizzle-orm/pg-core'

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
    ...timestamps,
  },
  (table) => [
    index().on(table.organizationId),
  ],
)

export type Workspace = InferSelectModel<typeof Workspace>
