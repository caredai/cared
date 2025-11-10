import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import type { TokenPolicy } from '@cared/shared'
import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account, User } from './auth-alias'

export const apiTokenScope = ['account', 'user'] as const
export type ApiTokenScope = (typeof apiTokenScope)[number]
export const apiTokenScopeEnum = pgEnum('apiTokenScope', apiTokenScope)

export interface ApiTokenMetadata {
  start: string
  end: string
}

export const ApiToken = pgTable(
  'api_token',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId('at')),
    name: text().notNull(),
    policies: jsonb().$type<TokenPolicy[]>().notNull(),
    hash: text().unique().notNull(),
    enabled: boolean().notNull(),
    expiresAt: timestamp({
      mode: 'date',
      withTimezone: true,
    }),
    notBefore: timestamp({
      mode: 'date',
      withTimezone: true,
    }),
    metadata: jsonb().$type<ApiTokenMetadata>().notNull(),
    scope: apiTokenScopeEnum().notNull(),
    accountId: text().references(() => Account.id, { onDelete: 'cascade' }),
    userId: text().references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index().on(table.hash),
    index().on(table.scope, table.accountId, table.userId),
    index().on(table.scope, table.userId),
    ...timestampsIndices(table),
  ],
)

export type ApiToken = InferSelectModel<typeof ApiToken>
