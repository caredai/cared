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

const retrievalModes = ['vector-search', 'full-text-search', 'hybrid-search'] as const

export interface DatasetMetadata {
  description: string

  languageModel: string // used for splitting a document into segments and chunks
  embeddingModel: string
  rerankModel: string
  retrievalMode: 'vector-search' | 'full-text-search' | 'hybrid-search'
  topK?: number
  scoreThreshold?: number

  [key: string]: unknown
}

const datasetMetadataZod = z.object({
  languageModel: z.string().min(1).optional(),
  embeddingModel: z.string().min(1).optional(),
  rerankModel: z.string().min(1).optional(),
  retrievalMode: z.enum(retrievalModes).optional(),
  topK: z.number().int().min(1).max(10).optional(),
  scoreThreshold: z.number().min(0).max(1).step(0.01).optional(),
})

export const Dataset = pgTable(
  'dataset',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    name: varchar({ length: 255 }).notNull(),
    metadata: jsonb().$type<DatasetMetadata>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.workspaceId),
    index().on(table.name),
    ...timestampsIndices(table),
  ],
)

export type Dataset = InferSelectModel<typeof Dataset>

export const CreateDatasetSchema = createInsertSchema(Dataset, {
  workspaceId: z.string().uuid(),
  name: z.string().max(255),
  metadata: datasetMetadataZod,
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDatasetSchema = createUpdateSchema(Dataset, {
  id: z.string().uuid(),
  name: z.string().max(255).optional(),
  metadata: datasetMetadataZod.optional(),
}).omit({
  workspaceId: true,
  ...timestampsOmits,
})

export interface DocumentMetadata {
  url?: string
  processed?: boolean
  taskId?: string

  [key: string]: unknown
}

const documentMetadataZod = z.object({
  url: z.string().optional(),
  processed: z.boolean().optional(),
  taskId: z.string().min(1).optional(),
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
    metadata: jsonb().$type<DocumentMetadata>().notNull().default({}),
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
  metadata: documentMetadataZod.optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDocumentSchema = createUpdateSchema(Document, {
  id: z.string().uuid(),
  name: z.string().max(255).optional(),
  metadata: documentMetadataZod.optional(),
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
