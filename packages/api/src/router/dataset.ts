import { DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { DatasetMetadata } from '@mindworld/db/schema'
import { and, count, desc, eq } from '@mindworld/db'
import {
  CreateDatasetSchema,
  CreateDocumentChunkSchema,
  CreateDocumentSchema,
  CreateDocumentSegmentSchema,
  Dataset,
  Document,
  DocumentChunk,
  DocumentSegment,
  UpdateDatasetSchema,
  UpdateDocumentChunkSchema,
  UpdateDocumentSchema,
  UpdateDocumentSegmentSchema,
} from '@mindworld/db/schema'
import { defaultModels } from '@mindworld/providers'
import { log, mergeWithoutUndefined } from '@mindworld/utils'

import type { Context } from '../trpc'
import { env } from '../env'
import { getClient } from '../s3-upload/client'
import { taskTrigger } from '../tasks'
import { protectedProcedure } from '../trpc'
import { verifyWorkspaceMembership } from './workspace'

/**
 * Get a dataset by ID and verify workspace access.
 */
async function getDatasetById(ctx: Context, id: string, workspaceId?: string) {
  const query = workspaceId
    ? and(eq(Dataset.id, id), eq(Dataset.workspaceId, workspaceId))
    : eq(Dataset.id, id)

  const dataset = await ctx.db.query.Dataset.findFirst({
    where: query,
  })

  if (!dataset) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Dataset with id ${id} not found`,
    })
  }

  return dataset
}

export const datasetRouter = {
  /**
   * List all datasets in a workspace.
   * Only accessible by workspace members.
   */
  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(Dataset)
        .where(eq(Dataset.workspaceId, input.workspaceId))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get dataset count',
        })
      }

      const datasets = await ctx.db
        .select()
        .from(Dataset)
        .where(eq(Dataset.workspaceId, input.workspaceId))
        .orderBy(desc(Dataset.createdAt))
        .offset(input.offset)
        .limit(input.limit)

      return {
        datasets,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * Get a single dataset by ID within a workspace.
   * Only accessible by workspace members.
   */
  byId: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const dataset = await ctx.db.query.Dataset.findFirst({
      where: eq(Dataset.id, input),
    })

    if (!dataset) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Dataset with id ${input} not found`,
      })
    }

    await verifyWorkspaceMembership(ctx, dataset.workspaceId)

    return { dataset }
  }),

  /**
   * Create a new dataset in a workspace.
   * Only accessible by workspace members.
   */
  create: protectedProcedure.input(CreateDatasetSchema).mutation(async ({ ctx, input }) => {
    await verifyWorkspaceMembership(ctx, input.workspaceId)

    const values = {
      ...input,
      metadata: mergeWithoutUndefined<DatasetMetadata>(
        {
          ...defaultModels.dataset,
          retrievalMode: 'hybrid-search',
        },
        input.metadata,
      ),
    }

    const [dataset] = await ctx.db.insert(Dataset).values(values).returning()

    if (!dataset) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create dataset',
      })
    }

    return { dataset }
  }),

  /**
   * Update an existing dataset in a workspace.
   * Only accessible by workspace members.
   */
  update: protectedProcedure.input(UpdateDatasetSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input

    const dataset = await getDatasetById(ctx, id)
    await verifyWorkspaceMembership(ctx, dataset.workspaceId)

    // Merge new metadata with existing metadata
    const update = {
      ...updates,
      metadata: mergeWithoutUndefined<DatasetMetadata>(dataset.metadata, updates.metadata),
    }

    const [updatedDataset] = await ctx.db
      .update(Dataset)
      .set(update)
      .where(eq(Dataset.id, id))
      .returning()

    if (!updatedDataset) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update dataset',
      })
    }

    return { dataset: updatedDataset }
  }),

  /**
   * Delete a dataset from a workspace.
   * Also deletes all associated documents, segments, chunks and S3 files.
   * Only accessible by workspace members.
   */
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const dataset = await getDatasetById(ctx, input)

    await verifyWorkspaceMembership(ctx, dataset.workspaceId)

    const documentUrls = await ctx.db
      .select({
        metadata: Document.metadata,
      })
      .from(Document)
      .where(eq(Document.datasetId, input))
      .then((docs) => docs.map((doc) => doc.metadata.url))

    await ctx.db.transaction(async (tx) => {
      // Delete all document chunks
      await tx.delete(DocumentChunk).where(eq(DocumentChunk.datasetId, input))

      // Delete all document segments
      await tx.delete(DocumentSegment).where(eq(DocumentSegment.datasetId, input))

      // Delete all documents
      await tx.delete(Document).where(eq(Document.datasetId, input))

      // Delete the dataset itself
      await tx.delete(Dataset).where(eq(Dataset.id, input))
    })

    // Delete S3 files if they exist
    const s3ObjectsToDelete = documentUrls
      .filter((docUrl) => docUrl?.startsWith(env.S3_ENDPOINT))
      .map((docUrl) => {
        const url = new URL(docUrl!)
        const key = url.pathname.slice(1) // Remove leading slash
        return { Key: key }
      })
    if (s3ObjectsToDelete.length > 0) {
      try {
        const s3Client = getClient()
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: env.S3_BUCKET,
            Delete: {
              Objects: s3ObjectsToDelete,
              Quiet: true,
            },
          }),
        )
      } catch (error) {
        log.error('Failed to delete S3 objects', {
          datasetId: input,
          error,
        })
      }
    }
  }),

  /**
   * Create a new document in a dataset.
   * Only accessible by workspace members.
   */
  createDocument: protectedProcedure
    .input(CreateDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getDatasetById(ctx, input.datasetId, input.workspaceId)

      const [document] = await ctx.db.insert(Document).values(input).returning()

      if (!document) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create document',
        })
      }

      await taskTrigger.processDocument(document)

      return { document }
    }),

  /**
   * Update an existing document.
   * Only accessible by workspace members.
   */
  updateDocument: protectedProcedure
    .input(UpdateDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...update } = input

      const document = await ctx.db.query.Document.findFirst({
        where: eq(Document.id, id),
      })

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document with id ${id} not found`,
        })
      }

      await verifyWorkspaceMembership(ctx, document.workspaceId)

      const [updatedDocument] = await ctx.db
        .update(Document)
        .set(update)
        .where(eq(Document.id, id))
        .returning()

      if (!updatedDocument) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update document',
        })
      }

      return { document: updatedDocument }
    }),

  /**
   * Delete a document and all its segments and chunks.
   * Also deletes the associated S3 file if it exists.
   * Only accessible by workspace members.
   */
  deleteDocument: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const document = await ctx.db.query.Document.findFirst({
      where: eq(Document.id, input),
    })

    if (!document) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with id ${input} not found`,
      })
    }

    await verifyWorkspaceMembership(ctx, document.workspaceId)

    await ctx.db.transaction(async (tx) => {
      // Delete all chunks
      await tx.delete(DocumentChunk).where(eq(DocumentChunk.documentId, input))

      // Delete all segments
      await tx.delete(DocumentSegment).where(eq(DocumentSegment.documentId, input))

      // Delete the document itself
      await tx.delete(Document).where(eq(Document.id, input))
    })

    // Delete S3 file if exists
    if (document.metadata.url?.startsWith(env.S3_ENDPOINT)) {
      try {
        const s3Client = getClient()
        const url = new URL(document.metadata.url)
        const key = url.pathname.slice(1) // Remove leading slash

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: key,
          }),
        )
      } catch (error) {
        log.error('Failed to delete S3 object', {
          url: document.metadata.url,
          error,
        })
      }
    }
  }),

  /**
   * List all documents in a dataset.
   * Only accessible by workspace members.
   */
  listDocuments: protectedProcedure
    .input(
      z.object({
        datasetId: z.string(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const dataset = await ctx.db.query.Dataset.findFirst({
        where: eq(Dataset.id, input.datasetId),
      })

      if (!dataset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Dataset with id ${input.datasetId} not found`,
        })
      }

      await verifyWorkspaceMembership(ctx, dataset.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(Document)
        .where(eq(Document.datasetId, input.datasetId))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get document count',
        })
      }

      const documents = await ctx.db
        .select()
        .from(Document)
        .where(eq(Document.datasetId, input.datasetId))
        .orderBy(desc(Document.createdAt))
        .offset(input.offset)
        .limit(input.limit)

      return {
        documents,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * Get a single document by ID.
   * Only accessible by workspace members.
   */
  getDocument: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const document = await ctx.db.query.Document.findFirst({
      where: eq(Document.id, input),
    })

    if (!document) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with id ${input} not found`,
      })
    }

    await verifyWorkspaceMembership(ctx, document.workspaceId)

    return { document }
  }),

  /**
   * Create a new document segment.
   * Only accessible by workspace members.
   */
  createSegment: protectedProcedure
    .input(CreateDocumentSegmentSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getDatasetById(ctx, input.datasetId, input.workspaceId)

      const document = await ctx.db.query.Document.findFirst({
        where: eq(Document.id, input.documentId),
      })

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document with id ${input.documentId} not found`,
        })
      }

      if (document.workspaceId !== input.workspaceId || document.datasetId !== input.datasetId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this document',
        })
      }

      const [segment] = await ctx.db.insert(DocumentSegment).values(input).returning()

      if (!segment) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create document segment',
        })
      }

      return { segment }
    }),

  /**
   * Update an existing document segment.
   * Only accessible by workspace members.
   */
  updateSegment: protectedProcedure
    .input(UpdateDocumentSegmentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const segment = await ctx.db.query.DocumentSegment.findFirst({
        where: eq(DocumentSegment.id, id),
      })

      if (!segment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document segment with id ${id} not found`,
        })
      }

      await verifyWorkspaceMembership(ctx, segment.workspaceId)

      const [updatedSegment] = await ctx.db
        .update(DocumentSegment)
        .set(updateData)
        .where(eq(DocumentSegment.id, id))
        .returning()

      if (!updatedSegment) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update document segment',
        })
      }

      return { segment: updatedSegment }
    }),

  /**
   * Delete a document segment and all its chunks.
   * Only accessible by workspace members.
   */
  deleteSegment: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const segment = await ctx.db.query.DocumentSegment.findFirst({
      where: eq(DocumentSegment.id, input),
    })

    if (!segment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document segment with id ${input} not found`,
      })
    }

    await verifyWorkspaceMembership(ctx, segment.workspaceId)

    return await ctx.db.transaction(async (tx) => {
      // Delete all chunks
      await tx.delete(DocumentChunk).where(eq(DocumentChunk.segmentId, input))

      // Delete the segment itself
      await tx.delete(DocumentSegment).where(eq(DocumentSegment.id, input))

      return { success: true }
    })
  }),

  /**
   * List all segments in a document.
   * Only accessible by workspace members.
   */
  listSegments: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.query.Document.findFirst({
        where: eq(Document.id, input.documentId),
      })

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document with id ${input.documentId} not found`,
        })
      }

      await verifyWorkspaceMembership(ctx, document.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(DocumentSegment)
        .where(eq(DocumentSegment.documentId, input.documentId))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get segment count',
        })
      }

      const segments = await ctx.db
        .select()
        .from(DocumentSegment)
        .where(eq(DocumentSegment.documentId, input.documentId))
        .orderBy(desc(DocumentSegment.index))
        .offset(input.offset)
        .limit(input.limit)

      return {
        segments,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * Create a new document chunk.
   * Only accessible by workspace members.
   */
  createChunk: protectedProcedure
    .input(CreateDocumentChunkSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getDatasetById(ctx, input.datasetId, input.workspaceId)

      const segment = await ctx.db.query.DocumentSegment.findFirst({
        where: eq(DocumentSegment.id, input.segmentId),
      })

      if (!segment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document segment with id ${input.segmentId} not found`,
        })
      }

      if (
        segment.workspaceId !== input.workspaceId ||
        segment.datasetId !== input.datasetId ||
        segment.documentId !== input.documentId
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this document segment',
        })
      }

      const [chunk] = await ctx.db.insert(DocumentChunk).values(input).returning()

      if (!chunk) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create document chunk',
        })
      }

      return { chunk }
    }),

  /**
   * Update an existing document chunk.
   * Only accessible by workspace members.
   */
  updateChunk: protectedProcedure
    .input(UpdateDocumentChunkSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input as {
        id: string
        content?: string
        metadata?: Record<string, unknown>
      }

      const chunk = await ctx.db.query.DocumentChunk.findFirst({
        where: eq(DocumentChunk.id, id),
      })

      if (!chunk) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document chunk with id ${id} not found`,
        })
      }

      await verifyWorkspaceMembership(ctx, chunk.workspaceId)

      const [updatedChunk] = await ctx.db
        .update(DocumentChunk)
        .set(updateData)
        .where(eq(DocumentChunk.id, id))
        .returning()

      if (!updatedChunk) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update document chunk',
        })
      }

      return { chunk: updatedChunk }
    }),

  /**
   * Delete a document chunk.
   * Only accessible by workspace members.
   */
  deleteChunk: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const chunk = await ctx.db.query.DocumentChunk.findFirst({
      where: eq(DocumentChunk.id, input),
    })

    if (!chunk) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document chunk with id ${input} not found`,
      })
    }

    await verifyWorkspaceMembership(ctx, chunk.workspaceId)

    await ctx.db.delete(DocumentChunk).where(eq(DocumentChunk.id, input))

    return { success: true }
  }),

  /**
   * List all chunks in a document segment.
   * Only accessible by workspace members.
   */
  listChunks: protectedProcedure
    .input(
      z.object({
        segmentId: z.string(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const segment = await ctx.db.query.DocumentSegment.findFirst({
        where: eq(DocumentSegment.id, input.segmentId),
      })

      if (!segment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document segment with id ${input.segmentId} not found`,
        })
      }

      await verifyWorkspaceMembership(ctx, segment.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(DocumentChunk)
        .where(eq(DocumentChunk.segmentId, input.segmentId))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get chunk count',
        })
      }

      const chunks = await ctx.db
        .select()
        .from(DocumentChunk)
        .where(eq(DocumentChunk.segmentId, input.segmentId))
        .orderBy(desc(DocumentChunk.index))
        .offset(input.offset)
        .limit(input.limit)

      return {
        chunks,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),
}
