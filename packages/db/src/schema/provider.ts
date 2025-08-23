import type { InferSelectModel } from 'drizzle-orm'
import { boolean, index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import type {
  ModelInfos,
  ProviderId,
  ProviderKey as ProviderKeyContent,
  ProvidersSettings as ProvidersSettingsContent,
} from '@cared/providers'
import { generateId, timestamps } from '@cared/shared'

import { Organization, User } from './auth-alias'

export const ProviderModels = pgTable(
  'provider_models',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('pm')),
    isSystem: boolean().notNull(),
    userId: text().references(() => User.id, { onDelete: 'cascade' }),
    organizationId: text().references(() => Organization.id, { onDelete: 'cascade' }),
    providerId: text().$type<ProviderId>().notNull(),
    models: jsonb().$type<ModelInfos>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.isSystem, table.providerId),
    index().on(table.userId, table.providerId),
    index().on(table.organizationId, table.providerId),
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
    isSystem: boolean().notNull(),
    userId: text().references(() => User.id, { onDelete: 'cascade' }),
    organizationId: text().references(() => Organization.id, { onDelete: 'cascade' }),
    settings: jsonb().$type<ProvidersSettingsContent>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.isSystem),
    index().on(table.userId),
    index().on(table.organizationId),
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
    isSystem: boolean(),
    userId: text().references(() => User.id, { onDelete: 'cascade' }),
    organizationId: text().references(() => Organization.id, { onDelete: 'cascade' }),
    providerId: text().$type<ProviderId>().notNull(),
    key: jsonb().$type<ProviderKeyContent>().notNull(),
    disabled: boolean().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.isSystem, table.providerId),
    index().on(table.userId, table.providerId),
    index().on(table.organizationId, table.providerId),
  ],
)

export type ProviderKey = InferSelectModel<typeof ProviderKey>
