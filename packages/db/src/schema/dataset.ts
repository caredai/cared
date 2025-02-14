import type { InferSelectModel } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { timestamps, timestampsIndices, timestampsOmits } from './utils'
import { Workspace } from './workspace'

export const Dataset = pgTable(
  'dataset',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    name: varchar({ length: 255 }).notNull(),
    metadata: jsonb().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId),
    ...timestampsIndices(table),
  ],
)

export type Dataset = InferSelectModel<typeof Dataset>

export const CreateDatasetSchema = createInsertSchema(Dataset, {
  workspaceId: z.string().uuid(),
  name: z.string().max(255),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDatasetSchema = createUpdateSchema(Dataset, {
  id: z.string().uuid(),
  name: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  workspaceId: true,
  ...timestampsOmits,
})

export const Document = pgTable(
  'document',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    datasetId: uuid()
      .notNull()
      .references(() => Dataset.id),
    name: varchar({ length: 255 }).notNull(),
    url: text(), // optional
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId, table.datasetId),
    index().on(table.datasetId),
    ...timestampsIndices(table),
  ],
)

export type Document = InferSelectModel<typeof Document>

export const CreateDocumentSchema = createInsertSchema(Document, {
  workspaceId: z.string().uuid(),
  datasetId: z.string().uuid(),
  name: z.string().max(255),
  url: z.string().optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDocumentSchema = createUpdateSchema(Document, {
  id: z.string().uuid(),
  name: z.string().max(255).optional(),
  url: z.string().optional(),
}).omit({
  workspaceId: true,
  datasetId: true,
  ...timestampsOmits,
})

export const DocumentSegment = pgTable(
  'document_segment',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    datasetId: uuid()
      .notNull()
      .references(() => Dataset.id),
    documentId: uuid()
      .notNull()
      .references(() => Document.id),
    index: integer().notNull(),
    content: text().notNull(),
    metadata: jsonb().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.workspaceId, table.datasetId, table.documentId, table.index),
    index().on(table.datasetId, table.documentId, table.index),
    index().on(table.documentId, table.index),
    ...timestampsIndices(table),
  ],
)

export type DocumentSegment = InferSelectModel<typeof DocumentSegment>

export const CreateDocumentSegmentSchema = createInsertSchema(DocumentSegment, {
  workspaceId: z.string().uuid(),
  datasetId: z.string().uuid(),
  documentId: z.string().uuid(),
  index: z.number().int(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDocumentSegmentSchema = createUpdateSchema(DocumentSegment, {
  id: z.string().uuid(),
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  workspaceId: true,
  datasetId: true,
  documentId: true,
  index: true,
  ...timestampsOmits,
})

export const DocumentChunk = pgTable(
  'document_chunk',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    datasetId: uuid()
      .notNull()
      .references(() => Dataset.id),
    documentId: uuid()
      .notNull()
      .references(() => Document.id),
    segmentId: uuid()
      .notNull()
      .references(() => DocumentSegment.id),
    index: integer().notNull(),
    content: text().notNull(),
    metadata: jsonb().notNull().default({}),
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
    index().on(table.datasetId, table.documentId, table.segmentId, table.index),
    index().on(table.documentId, table.segmentId, table.index),
    index().on(table.segmentId, table.index),
    ...timestampsIndices(table),
  ],
)

export type DocumentChunk = InferSelectModel<typeof DocumentChunk>

export const CreateDocumentChunkSchema = createInsertSchema(DocumentChunk, {
  workspaceId: z.string().uuid(),
  datasetId: z.string().uuid(),
  documentId: z.string().uuid(),
  segmentId: z.string().uuid(),
  index: z.number().int(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDocumentChunkSchema = createUpdateSchema(DocumentChunk, {
  id: z.string().uuid(),
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  workspaceId: true,
  datasetId: true,
  documentId: true,
  segmentId: true,
  index: true,
  ...timestampsOmits,
})
