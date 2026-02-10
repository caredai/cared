import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { ORPCError } from '@orpc/server'
import mime from 'mime'
import sanitize from 'sanitize-filename'
import { z } from 'zod/v4'

import { and, desc, eq, lt } from '@cared/db'
import { db } from '@cared/db/client'
import { File, generateId } from '@cared/db/schema'

import { s3Client } from '../../../client/s3'
import { env } from '../../../env'
import { userOrAppUserProtectedProcedure } from '../../../orpc'
import { deleteImage, extractImageKey, imageUrl } from '../../utils'

const allowedExtensions = [
  'jpg',
  'jpeg',
  'webp',
  'avif',
  'png',
  'gif',
  'svg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
]

const fileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.url(),
  chatId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

function formatFile(file: File) {
  const {
    id,
    chatId,
    metadata: { filename, mimeType, size, url },
    createdAt,
    updatedAt,
  } = file
  return {
    id,
    filename,
    mimeType,
    size,
    url,
    chatId: chatId ?? undefined,
    createdAt,
    updatedAt,
  }
}

export const fileRouter = {
  /**
   * Create/upload a file directly to S3 and save to database
   */
  create: userOrAppUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/files',
      tags: ['files'],
      summary: 'Upload a file directly to S3 and save to database',
    })
    .input(
      z.object({
        file: z.file(),
        filename: z.string().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .output(
      z.object({
        file: fileSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const filename = input.filename ?? input.file.name
      const mimeType = input.mimeType ?? mime.getType(filename.split('.').pop() ?? '')
      if (!mimeType) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid mime type',
        })
      }
      const fileType = mime.getExtension(mimeType)
      if (!fileType || !allowedExtensions.includes(fileType)) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid file type',
        })
      }

      const id = generateId('file')
      const key = `${context.auth.userId}/${id}/${sanitize(filename)}`
      const url = new URL(key, imageUrl()).toString()

      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: input.file,
        ContentType: mimeType,
      })
      const response = await s3Client.send(command)

      const size = response.Size ?? input.file.size

      const [file] = await db
        .insert(File)
        .values({
          id,
          accountId: context.auth.accountId,
          userId: context.auth.userId,
          metadata: {
            filename,
            mimeType,
            size,
            url,
          },
        })
        .returning()

      if (!file) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to create file record',
        })
      }

      return {
        file: formatFile(file),
      }
    }),

  /**
   * List files for the current user in the account
   */
  list: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/files',
      tags: ['files'],
      summary: 'List files for the current user in the account',
    })
    .input(
      z.object({
        chatId: z.string().optional(),
        limit: z.int().positive().max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .output(
      z.object({
        files: z.array(fileSchema),
        hasMore: z.boolean(),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const conditions = [
        eq(File.accountId, context.auth.accountId),
        eq(File.userId, context.auth.userId),
      ]

      if (input.chatId) {
        conditions.push(eq(File.chatId, input.chatId))
      }

      // Pagination cursor - use lt for descending order
      if (input.cursor) {
        conditions.push(lt(File.id, input.cursor))
      }

      const query = and(...conditions)

      const files = await db
        .select()
        .from(File)
        .where(query)
        .orderBy(desc(File.id))
        .limit(input.limit + 1)

      const hasMore = files.length > input.limit
      if (hasMore) {
        files.pop()
      }
      const cursor = files.at(-1)?.id

      return {
        files: files.map(formatFile),
        hasMore,
        cursor,
      }
    }),

  /**
   * Get file metadata from database and S3
   */
  get: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/files/{id}',
      tags: ['files'],
      summary: 'Get file metadata from database and S3',
    })
    .input(
      z.object({
        id: z.string().min(1, 'File ID cannot be empty'),
      }),
    )
    .output(
      z.object({
        file: fileSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const file = await db.query.File.findFirst({
        where: and(
          eq(File.id, input.id),
          eq(File.accountId, context.auth.accountId),
          eq(File.userId, context.auth.userId),
        ),
      })
      if (!file) {
        throw new ORPCError('NOT_FOUND', {
          message: 'File not found',
        })
      }

      return {
        file: formatFile(file),
      }
    }),

  /**
   * Download a file
   */
  retrieve: userOrAppUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/files/{id}/download',
      tags: ['files'],
      summary: 'Download a file',
    })
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .output(
      z.object({
        file: z.file(),
      }),
    )
    .handler(async ({ context, input }) => {
      const file = await db.query.File.findFirst({
        where: and(
          eq(File.id, input.id),
          eq(File.accountId, context.auth.accountId),
          eq(File.userId, context.auth.userId),
        ),
      })
      if (!file) {
        throw new ORPCError('NOT_FOUND', {
          message: 'File not found',
        })
      }

      const metadata = file.metadata

      const key = extractImageKey(metadata.url)
      if (!key) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'File not found',
        })
      }

      const command = new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
      })
      const response = await s3Client.send(command)
      if (!response.Body) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'File not found',
        })
      }

      const blob = await new Response(response.Body).blob()
      return {
        file: new globalThis.File([blob], metadata.filename, { type: metadata.mimeType }),
      }
    }),

  /**
   * Delete a file from S3 and database
   */
  delete: userOrAppUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/files/{id}',
      tags: ['files'],
      summary: 'Delete a file',
    })
    .input(
      z.object({
        id: z.string().min(1, 'File ID cannot be empty'),
      }),
    )
    .output(
      z.object({
        file: fileSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const file = await db.query.File.findFirst({
        where: and(
          eq(File.id, input.id),
          eq(File.accountId, context.auth.accountId),
          eq(File.userId, context.auth.userId),
        ),
      })
      if (!file) {
        throw new ORPCError('NOT_FOUND', {
          message: 'File not found',
        })
      }

      const metadata = file.metadata

      // Delete from database
      await db.delete(File).where(eq(File.id, input.id))

      await deleteImage(metadata.url)

      return {
        file: formatFile(file),
      }
    }),
}
