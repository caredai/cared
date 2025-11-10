import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import type {
  ModelInfos,
  ProviderId,
  ProviderKey as ProviderKeyContent,
  ProvidersSettings as ProvidersSettingsContent,
} from '@cared/providers'
import { generateId, timestamps } from '@cared/shared'

import { Account } from './auth-alias'

export const ProviderModels = pgTable(
  'provider_models',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('pm')),
    accountId: text().references(() => Account.id, { onDelete: 'cascade' }),
    providerId: text().$type<ProviderId>().notNull(),
    models: jsonb().$type<ModelInfos>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId, table.providerId),
  ],
)

export type ProviderModels = InferSelectModel<typeof ProviderModels>

export const ProviderSettings = pgTable(
  'provider_settings',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('ps')),
    accountId: text().references(() => Account.id, { onDelete: 'cascade' }),
    settings: jsonb().$type<ProvidersSettingsContent>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId),
  ],
)

export type ProviderSettings = InferSelectModel<typeof ProviderSettings>

export const ProviderKey = pgTable(
  'provider_key',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('pak')),
    accountId: text().references(() => Account.id, { onDelete: 'cascade' }),
    providerId: text().$type<ProviderId>().notNull(),
    key: jsonb().$type<ProviderKeyContent>().notNull(),
    disabled: boolean().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.accountId, table.providerId),
  ],
)

export type ProviderKey = InferSelectModel<typeof ProviderKey>
