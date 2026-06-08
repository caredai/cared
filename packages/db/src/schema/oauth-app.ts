import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, text } from 'drizzle-orm/pg-core'

import { Account } from './auth-alias'
import { generateId, timestamps, timestampsIndices } from './utils'

export const OAuthApp = pgTable(
  'oauth_app',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('oa')),
    accountId: text()
      .notNull()
      .references(() => Account.id, { onDelete: 'no action' }),
    clientId: text().notNull().unique(), // for confidential client
    publicClientId: text().notNull().unique(), // for public client
    clientSecretStart: text().notNull(), // for confidential client
    clientSecretEnd: text().notNull(), // for confidential client
    redirectUris: text().array().notNull(),
    scopes: text().array(),
    name: text().notNull(),
    description: text(),
    homeUrl: text(),
    logo: text(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
    index().on(table.clientId),
    index().on(table.publicClientId),
    index().on(table.name),
    ...timestampsIndices(table),
  ],
)

export type OAuthApp = InferSelectModel<typeof OAuthApp>
