import type { InferSelectModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { index, json, pgEnum, pgTable, primaryKey, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import {
  timestamps,
  timestampsIndices,
  timestampsOmits,
  visibilityEnum,
  visibilityEnumValues,
} from './utils'
import {Workspace} from './workspace'

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
    type: appTypeEnum().notNull().default('single-agent'),
    name: varchar({ length: 255 }).notNull(),
    metadata: json('metadata').$type<AppMetadata>().notNull().default({}),
    visibility: visibilityEnum().notNull().default('private'),
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId),
    index().on(table.type),
    index().on(table.name),
    index().on(table.visibility),
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
    .catchall(z.unknown()),
  visibility: z.enum(visibilityEnumValues).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateAppSchema = createUpdateSchema(App, {
  id: z.string(),
  name: z.string().max(255).optional(),
  metadata: z
    .object({
      description: z.string().optional(),
    })
    .catchall(z.unknown())
    .optional(),
  visibility: z.enum(visibilityEnumValues).optional(),
}).omit({
  workspaceId: true,
  type: true,
  ...timestampsOmits,
})

export const Category = pgTable(
  'category',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
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

export const appRelations = relations(App, ({ many }) => ({
  categories: many(AppsToCategories),
}))

export const categoryRelations = relations(Category, ({ many }) => ({
  apps: many(AppsToCategories),
}))

export const appsToCategoriesRelations = relations(AppsToCategories, ({ one }) => ({
  app: one(App, {
    fields: [AppsToCategories.appId],
    references: [App.id],
  }),
  category: one(Category, {
    fields: [AppsToCategories.categoryId],
    references: [Category.id],
  }),
}))
