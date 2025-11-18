import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account } from './auth-alias'

export interface McpConfiguration {
  toolkits?: string[] // toolkit slugs
  tools?: string[] // tool slugs from the specified toolkits
}

export const Mcp = pgTable(
  'mcp',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('mcp')),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    configuration: jsonb().$type<McpConfiguration>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    ...timestampsIndices(table),
  ],
)

export type Mcp = InferSelectModel<typeof Mcp>
