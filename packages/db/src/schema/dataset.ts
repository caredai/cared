import type { InferSelectModel } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { generateId, timestamps, timestampsIndices, timestampsOmits } from './utils'
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

  stats?: {
    /**
     * Total size of all documents in bytes
     */
    totalSizeBytes?: number
  }

  [key: string]: unknown
}

const datasetMetadataZod = z.object({
  languageModel: z.string().min(1).optional(),
  embeddingModel: z.string().min(1).optional(),
  rerankModel: z.string().min(1).optional(),
  retrievalMode: z.enum(retrievalModes).optional(),
  topK: z.number().int().min(1).max(10).optional(),
  scoreThreshold: z.number().min(0).max(1).step(0.01).optional(),
  stats: z
    .object({
      totalSizeBytes: z.number().int().optional(),
    })
    .optional(),
})

export const Dataset = pgTable(
  'dataset',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('dataset')),
    workspaceId: text()
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
  workspaceId: z.string(),
  name: z.string().max(255),
  metadata: datasetMetadataZod,
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDatasetSchema = createUpdateSchema(Dataset, {
  id: z.string(),
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
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('doc')),
    workspaceId: text()
      .notNull()
      .references(() => Workspace.id),
    datasetId: text()
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
  workspaceId: z.string(),
  datasetId: z.string(),
  name: z.string().max(255),
  metadata: documentMetadataZod.optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDocumentSchema = createUpdateSchema(Document, {
  id: z.string(),
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
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('dseg')),
    workspaceId: text()
      .notNull()
      .references(() => Workspace.id),
    datasetId: text()
      .notNull()
      .references(() => Dataset.id),
    documentId: text()
      .notNull()
      .references(() => Document.id),
    index: integer().notNull(),
    content: text().notNull(),
    metadata: jsonb().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('document_segment_wddi_index').on(
      table.workspaceId,
      table.datasetId,
      table.documentId,
      table.index,
    ),
    index('document_segment_ddi_index').on(table.datasetId, table.documentId, table.index),
    index('document_segment_di_index').on(table.documentId, table.index),
    ...timestampsIndices(table),
  ],
)

export type DocumentSegment = InferSelectModel<typeof DocumentSegment>

export const CreateDocumentSegmentSchema = createInsertSchema(DocumentSegment, {
  workspaceId: z.string(),
  datasetId: z.string(),
  documentId: z.string(),
  index: z.number().int(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDocumentSegmentSchema = createUpdateSchema(DocumentSegment, {
  id: z.string(),
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
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('dchunk')),
    workspaceId: text()
      .notNull()
      .references(() => Workspace.id),
    datasetId: text()
      .notNull()
      .references(() => Dataset.id),
    documentId: text()
      .notNull()
      .references(() => Document.id),
    segmentId: text()
      .notNull()
      .references(() => DocumentSegment.id),
    index: integer().notNull(),
    content: text().notNull(),
    metadata: jsonb().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('document_chunk_wddsi_index').on(
      table.workspaceId,
      table.datasetId,
      table.documentId,
      table.segmentId,
      table.index,
    ),
    index('document_chunk_ddsi_index').on(
      table.datasetId,
      table.documentId,
      table.segmentId,
      table.index,
    ),
    index('document_chunk_dsi_index').on(table.documentId, table.segmentId, table.index),
    index('document_chunk_si_index').on(table.segmentId, table.index),
    ...timestampsIndices(table),
  ],
)

export type DocumentChunk = InferSelectModel<typeof DocumentChunk>

export const CreateDocumentChunkSchema = createInsertSchema(DocumentChunk, {
  workspaceId: z.string(),
  datasetId: z.string(),
  documentId: z.string(),
  segmentId: z.string(),
  index: z.number().int(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateDocumentChunkSchema = createUpdateSchema(DocumentChunk, {
  id: z.string(),
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
