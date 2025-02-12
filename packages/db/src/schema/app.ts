import type { InferSelectModel } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { timestamps, timestampsIndices, timestampsOmits } from './utils'
import { Workspace } from './workspace'

export const appTypeEnumValues = ['single-agent', 'multiple-agents'] as const
export const appTypeEnum = pgEnum('appType', appTypeEnumValues)

export interface AppMetadata {
  description?: string

  [key: string]: unknown
}

export const App = pgTable(
  'app',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    // type, name, metadata are always the same as the latest published version in the app version table
    type: appTypeEnum().notNull().default('single-agent'),
    name: varchar({ length: 255 }).notNull(),
    metadata: jsonb().$type<AppMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId),
    index().on(table.type),
    index().on(table.name),
    ...timestampsIndices(table),
  ],
)

export type App = InferSelectModel<typeof App>

export const CreateAppSchema = createInsertSchema(App, {
  workspaceId: z.string().uuid(),
  type: z.enum(appTypeEnumValues).optional(),
  name: z.string().max(255),
  metadata: z
    .object({
      description: z.string().optional(),
    })
    .catchall(z.unknown())
    .optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateAppSchema = createUpdateSchema(App, {
  id: z.string(),
  workspaceId: z.string().uuid(),
  name: z.string().max(255).optional(),
  metadata: z
    .object({
      description: z.string().optional(),
    })
    .catchall(z.unknown())
    .optional(),
}).omit({
  type: true,
  ...timestampsOmits,
})

// Use a fixed large number as the draft version.
// Choose 9007199254740991 because it's far beyond any reasonable Unix timestamp.
export const DRAFT_VERSION = 9007199254740991

export const AppVersion = pgTable(
  'app_version',
  {
    appId: uuid()
      .notNull()
      .references(() => App.id),
    // Must be Unix timestamp of the publishing time.
    // DRAFT_VERSION indicates an unpublished draft.
    version: integer().notNull().default(DRAFT_VERSION),
    type: appTypeEnum().notNull().default('single-agent'),
    name: varchar({ length: 255 }).notNull(),
    metadata: jsonb().$type<AppMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.version] }),
    ...timestampsIndices(table),
  ],
)

export type AppVersion = InferSelectModel<typeof AppVersion>

export const CreateAppVersionSchema = createInsertSchema(AppVersion, {
  appId: z.string().uuid(),
  version: z.number().int().optional(),
  type: z.enum(appTypeEnumValues).optional(),
  name: z.string().max(255),
  metadata: z
    .object({
      description: z.string().optional(),
    })
    .catchall(z.unknown())
    .optional(),
}).omit({
  ...timestampsOmits,
})

export const UpdateAppVersionSchema = createUpdateSchema(AppVersion, {
  appId: z.string(),
  version: z.number().int().optional(),
  name: z.string().max(255).optional(),
  metadata: z
    .object({
      description: z.string().optional(),
    })
    .catchall(z.unknown())
    .optional(),
}).omit({
  type: true,
  ...timestampsOmits,
})

export const Category = pgTable(
  'category',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    name: varchar({ length: 255 }).unique().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.name),
    ...timestampsIndices(table),
  ],
)

export type Category = InferSelectModel<typeof Category>

export const CreateCategorySchema = createInsertSchema(Category, {
  name: z.string().max(255),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateCategorySchema = createUpdateSchema(Category, {
  id: z.string(),
  name: z.string().max(255).optional(),
}).omit({
  ...timestampsOmits,
})

export const AppsToCategories = pgTable(
  'apps_to_categories',
  {
    appId: uuid()
      .notNull()
      .references(() => App.id),
    categoryId: uuid()
      .notNull()
      .references(() => Category.id),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.categoryId] }),
    index().on(table.categoryId),
    ...timestampsIndices(table),
  ],
)

export type AppsToCategories = InferSelectModel<typeof AppsToCategories>

export const CreateAppsToCategoriesSchema = createInsertSchema(AppsToCategories, {
  appId: z.string().uuid(),
  categoryId: z.string().uuid(),
}).omit({
  ...timestampsOmits,
})

export const Tag = pgTable(
  'tag',
  {
    name: varchar({ length: 255 }).primaryKey().notNull(),
    ...timestamps,
  },
  (table) => [
    ...timestampsIndices(table),
  ],
)

export type Tag = InferSelectModel<typeof Tag>

export const CreateTagSchema = createInsertSchema(Tag, {
  name: z.string().max(255),
}).omit({
  ...timestampsOmits,
})

export const AppsToTags = pgTable(
  'apps_to_tags',
  {
    appId: uuid()
      .notNull()
      .references(() => App.id),
    tag: varchar({ length: 255 })
      .notNull()
      .references(() => Tag.name),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.tag] }),
    index().on(table.tag),
    ...timestampsIndices(table),
  ],
)

export type AppsToTags = InferSelectModel<typeof AppsToTags>

export const CreateAppsToTagsSchema = createInsertSchema(AppsToTags, {
  appId: z.string().uuid(),
  tag: z.string().max(255),
}).omit({
  ...timestampsOmits,
})
