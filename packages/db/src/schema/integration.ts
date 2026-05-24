import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, jsonb, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account } from './auth-alias'

export const integrationTypes = [
  'github',
  'cloudflare',
] as const
export type IntegrationType = (typeof integrationTypes)[number]
export const integrationTypeEnum = pgEnum('integrationType', integrationTypes)

export type IntegrationMetadata =
  | {
      type: 'github'
      account: {
        type: 'User' | 'Organization'
        login: string // name of user or organization
        name: string // display name of user or organization
      }
    }
  | {
      type: 'cloudflare'
      accountName: string // account name
    }

export const Integration = pgTable(
  'integration',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('itg')),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'cascade' }),
    type: integrationTypeEnum().notNull(),
    identifier: text().notNull(),
    credentials: text(),
    metadata: jsonb().$type<IntegrationMetadata>().notNull(),
    isDefault: boolean(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId, table.type, table.identifier),
    unique().on(table.type, table.identifier),
    ...timestampsIndices(table),
  ],
)

export type Integration = InferSelectModel<typeof Integration>
