import type { InferSelectModel } from 'drizzle-orm'
import {
  index,
  integer,
  json,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { timestamps } from './utils'
import { Workspace } from './workspace'

export const dataset = pgTable(
  'dataset',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    name: varchar({ length: 255 }).notNull(),
    metadata: json(),
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId),
  ],
)

export type Dataset = InferSelectModel<typeof dataset>

export const document = pgTable(
  'document',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    datasetId: uuid()
      .notNull()
      .references(() => dataset.id),
    name: varchar({ length: 255 }).notNull(),
    url: text(), // optional
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId, table.datasetId),
  ],
)

export type Document = InferSelectModel<typeof document>

export const segment = pgTable(
  'segment',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    datasetId: uuid()
      .notNull()
      .references(() => dataset.id),
    documentId: uuid()
      .notNull()
      .references(() => document.id),
    index: integer().notNull(),
    content: text().notNull(),
    metadata: json(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.workspaceId, table.datasetId, table.documentId, table.index),
  ],
)

export type Segment = InferSelectModel<typeof segment>

export const chunk = pgTable(
  'chunk',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    datasetId: uuid()
      .notNull()
      .references(() => dataset.id),
    documentId: uuid()
      .notNull()
      .references(() => document.id),
    segmentId: uuid()
      .notNull()
      .references(() => segment.id),
    index: integer().notNull(),
    content: text().notNull(),
    embedding: text(),
    metadata: json(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(
      table.workspaceId,
      table.datasetId,
      table.documentId,
      table.segmentId,
      table.index,
    ),
  ],
)

export type Chunk = InferSelectModel<typeof chunk>
