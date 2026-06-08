import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import type { TokenPolicy } from '@cared/shared'
import { generateId, timestamps, timestampsIndices } from '@cared/shared'

import { Account, User } from './auth-alias'

export const apiTokenCredentialTypes = ['account', 'user'] as const
export type ApiTokenCredentialType = (typeof apiTokenCredentialTypes)[number]
export const apiTokenCredentialTypeEnum = pgEnum(
  'apiTokenCredentialType',
  apiTokenCredentialTypes,
)

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
    credentialType: apiTokenCredentialTypeEnum().notNull(),
    accountId: text().references(() => Account.id, { onDelete: 'cascade' }),
    userId: text().references(() => User.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index().on(table.hash),
    index().on(table.credentialType, table.accountId, table.userId),
    index().on(table.credentialType, table.userId),
    ...timestampsIndices(table),
  ],
)

export type ApiToken = InferSelectModel<typeof ApiToken>
