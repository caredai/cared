import { DeleteObjectCommand, DeleteObjectsCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@mindworld/db'
import type { DatasetMetadata } from '@mindworld/db/schema'
import { and, desc, eq, gt, lt } from '@mindworld/db'
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
import { log } from '@mindworld/log'
import { defaultModels } from '@mindworld/providers'
import { mergeWithoutUndefined } from '@mindworld/utils'

import type { Context } from '../trpc'
import { env } from '../env'
import { getClient } from '../routes/s3-upload/client'
import { taskTrigger } from '../routes/tasks'
import { userProtectedProcedure } from '../trpc'
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
  list: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/datasets',
        protect: true,
        tags: ['datasets'],
        summary: 'List all datasets in a workspace',
      },
    })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const conditions: SQL<unknown>[] = [eq(Dataset.workspaceId, input.workspaceId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(Dataset.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Dataset.id, input.before))
      }

      const datasets = await ctx.db
        .select()
        .from(Dataset)
        .where(and(...conditions))
        .orderBy(desc(Dataset.id))
        .limit(input.limit + 1)

      const hasMore = datasets.length > input.limit
      if (hasMore) {
        datasets.pop()
      }

      // Get first and last dataset IDs
      const first = datasets[0]?.id
      const last = datasets[datasets.length - 1]?.id

      return {
        datasets,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get a single dataset by ID within a workspace.
   * Only accessible by workspace members.
   */
  byId: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/datasets/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Get a single dataset by ID within a workspace',
      },
    })
    .input(z.string())
    .query(async ({ ctx, input }) => {
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
  create: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/datasets',
        protect: true,
        tags: ['datasets'],
        summary: 'Create a new dataset in a workspace',
      },
    })
    .input(CreateDatasetSchema)
    .mutation(async ({ ctx, input }) => {
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
  update: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/datasets/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Update an existing dataset in a workspace',
      },
    })
    .input(UpdateDatasetSchema)
    .mutation(async ({ ctx, input }) => {
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
  delete: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/datasets/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Delete a dataset from a workspace',
      },
    })
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const dataset = await getDatasetById(ctx, input)

      await verifyWorkspaceMembership(ctx, dataset.workspaceId)

      const documentUrls = await ctx.db
        .select({
          metadata: Document.metadata,
        })
        .from(Document)
        .where(eq(Document.datasetId, input))
        .then((docs) => docs.map((doc) => doc.metadata.url))

      if (dataset.metadata.stats) {
        log.info('Deleting dataset', {
          datasetId: dataset.id,
          stats: dataset.metadata.stats,
        })
      }

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
  createDocument: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/documents',
        protect: true,
        tags: ['datasets'],
        summary: 'Create a new document in a dataset',
      },
    })
    .input(CreateDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      const dataset = await getDatasetById(ctx, input.datasetId, input.workspaceId)

      // If document has S3 URL, get file size and update dataset metadata
      let fileSize: number | undefined
      if (input.metadata?.url?.startsWith(env.S3_ENDPOINT)) {
        const s3Client = getClient()
        const url = new URL(input.metadata.url)
        const key = url.pathname.slice(1) // Remove leading slash

        // Get file size
        const headObjectResponse = await s3Client.send(
          new HeadObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: key,
          }),
        )

        fileSize = headObjectResponse.ContentLength ?? 0
      }

      const document = await ctx.db.transaction(async (tx) => {
        const [document] = await tx.insert(Document).values(input).returning()
        if (!document) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create document',
          })
        }

        if (fileSize) {
          // Update total size in dataset metadata
          const updatedMetadata = {
            ...dataset.metadata,
            stats: {
              ...dataset.metadata.stats,
              totalSizeBytes: (dataset.metadata.stats?.totalSizeBytes ?? 0) + fileSize,
            },
          }

          await tx
            .update(Dataset)
            .set({ metadata: updatedMetadata })
            .where(eq(Dataset.id, dataset.id))

          log.debug('Update dataset stats after document insertion', {
            datasetId: dataset.id,
            documentId: document.id,
            fileSize,
            totalSizeBytes: updatedMetadata.stats.totalSizeBytes,
          })
        }

        return document
      })

      await taskTrigger.processDocument(document)

      return { document }
    }),

  /**
   * Update an existing document.
   * Only accessible by workspace members.
   */
  updateDocument: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/documents/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Update an existing document',
      },
    })
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
  deleteDocument: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/documents/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Delete a document and all its segments and chunks',
        description:
          'Deletes a document and all its related segments and chunks. Also deletes the associated S3 file if it exists.',
      },
    })
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
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

      const dataset = await ctx.db.query.Dataset.findFirst({
        where: eq(Dataset.id, document.datasetId),
      })
      if (!dataset) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Dataset with id ${document.datasetId} not found`,
        })
      }

      // If document has S3 URL, get file size and subtract from dataset metadata
      let fileSize: number | undefined
      if (document.metadata.url?.startsWith(env.S3_ENDPOINT)) {
        const s3Client = getClient()
        const url = new URL(document.metadata.url)
        const key = url.pathname.slice(1) // Remove leading slash

        // Get file size
        const headObjectResponse = await s3Client.send(
          new HeadObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: key,
          }),
        )

        fileSize = headObjectResponse.ContentLength ?? 0
      }

      await ctx.db.transaction(async (tx) => {
        if (fileSize) {
          // Update total size in dataset metadata
          const updatedMetadata = {
            ...dataset.metadata,
            stats: {
              ...dataset.metadata.stats,
              totalSizeBytes: Math.max(0, (dataset.metadata.stats?.totalSizeBytes ?? 0) - fileSize),
            },
          }

          log.debug('Update dataset stats after document deletion', {
            datasetId: dataset.id,
            documentId: document.id,
            fileSize,
            totalSizeBytes: updatedMetadata.stats.totalSizeBytes,
          })

          // Update dataset metadata
          await tx
            .update(Dataset)
            .set({ metadata: updatedMetadata })
            .where(eq(Dataset.id, dataset.id))
        }

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
  listDocuments: userProtectedProcedure
    .input(
      z.object({
        datasetId: z.string(),
        after: z.string().optional(),
        before: z.string().optional(),
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

      const conditions: SQL<unknown>[] = [eq(Document.datasetId, input.datasetId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(Document.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Document.id, input.before))
      }

      const documents = await ctx.db
        .select()
        .from(Document)
        .where(and(...conditions))
        .orderBy(desc(Document.id))
        .limit(input.limit + 1)

      const hasMore = documents.length > input.limit
      if (hasMore) {
        documents.pop()
      }

      // Get first and last document IDs
      const first = documents[0]?.id
      const last = documents[documents.length - 1]?.id

      return {
        documents,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get a single document by ID.
   * Only accessible by workspace members.
   */
  getDocument: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/documents/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Get a single document by ID',
      },
    })
    .input(z.string())
    .query(async ({ ctx, input }) => {
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
  createSegment: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/segments',
        protect: true,
        tags: ['datasets'],
        summary: 'Create a new document segment',
      },
    })
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
  updateSegment: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/segments/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Update an existing document segment',
      },
    })
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
  deleteSegment: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/segments/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Delete a document segment and all its chunks',
      },
    })
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
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
  listSegments: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/segments',
        protect: true,
        tags: ['datasets'],
        summary: 'List all segments in a document',
      },
    })
    .input(
      z.object({
        documentId: z.string(),
        after: z.string().optional(),
        before: z.string().optional(),
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

      const conditions: SQL<unknown>[] = [eq(DocumentSegment.documentId, input.documentId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(DocumentSegment.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(DocumentSegment.id, input.before))
      }

      const segments = await ctx.db
        .select()
        .from(DocumentSegment)
        .where(and(...conditions))
        .orderBy(desc(DocumentSegment.id))
        .limit(input.limit + 1)

      const hasMore = segments.length > input.limit
      if (hasMore) {
        segments.pop()
      }

      // Get first and last segment IDs
      const first = segments[0]?.id
      const last = segments[segments.length - 1]?.id

      return {
        segments,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Create a new document chunk.
   * Only accessible by workspace members.
   */
  createChunk: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/chunks',
        protect: true,
        tags: ['datasets'],
        summary: 'Create a new document chunk',
      },
    })
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
  updateChunk: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/chunks/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Update an existing document chunk',
      },
    })
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
  deleteChunk: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/chunks/{id}',
        protect: true,
        tags: ['datasets'],
        summary: 'Delete a document chunk',
      },
    })
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
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
  listChunks: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/chunks',
        protect: true,
        tags: ['datasets'],
        summary: 'List all chunks in a document segment',
      },
    })
    .input(
      z.object({
        segmentId: z.string(),
        after: z.string().optional(),
        before: z.string().optional(),
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

      const conditions: SQL<unknown>[] = [eq(DocumentChunk.segmentId, input.segmentId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(DocumentChunk.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(DocumentChunk.id, input.before))
      }

      const chunks = await ctx.db
        .select()
        .from(DocumentChunk)
        .where(and(...conditions))
        .orderBy(desc(DocumentChunk.id))
        .limit(input.limit + 1)

      const hasMore = chunks.length > input.limit
      if (hasMore) {
        chunks.pop()
      }

      // Get first and last chunk IDs
      const first = chunks[0]?.id
      const last = chunks[chunks.length - 1]?.id

      return {
        chunks,
        hasMore,
        first,
        last,
      }
    }),
}
