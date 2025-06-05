import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { charGroupMetadataSchema } from '@tavern/core'
import { CharGroup } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, eq, inArray } from 'drizzle-orm'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'
import { z } from 'zod'

import { makeObjectNonempty } from '@ownxai/sdk'

import { env } from '../env'
import { s3Client } from '../s3'
import { userProtectedProcedure } from '../trpc'
import { measure } from '../utils'
import { imageUrl } from './character'

async function uploadImage(dataUrl: string, name: string) {
  // Convert data URL to buffer
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const key = `character-groups/${uuid()}/${sanitize(name)}.png`
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
  })

  const [execSeconds] = await measure(s3Client.send(command))
  console.log('Upload character group image to object storage', {
    key,
    size: buffer.length,
    execSeconds,
  })

  return new URL(key, imageUrl()).toString()
}

async function processMetadata(metadata: z.infer<typeof charGroupMetadataSchema>) {
  if (metadata.imageUrl?.startsWith('data:')) {
    const imageUrl = await uploadImage(metadata.imageUrl, metadata.name)
    return {
      ...metadata,
      imageUrl,
    }
  }
  return metadata
}

async function deleteImage(url: string) {
  if (!url.startsWith(env.S3_ENDPOINT) && !url.startsWith(imageUrl())) {
    return
  }
  const key = decodeURIComponent(new URL(url).pathname.slice(1)) // Remove leading slash
  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })
  await s3Client.send(command)
}

async function deleteImages(urls: string[]) {
  // Filter out invalid URLs and extract keys
  const keys = urls
    .filter((url) => url.startsWith(env.S3_ENDPOINT) || url.startsWith(imageUrl()))
    .map((url) => ({
      Key: decodeURIComponent(new URL(url).pathname.slice(1)), // Remove leading slash
    }))

  if (keys.length === 0) {
    return
  }

  // AWS S3 DeleteObjects has a limit of 1000 objects per request
  const chunkSize = 1000
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize)
    const command = new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET,
      Delete: {
        Objects: chunk,
        Quiet: true, // Don't return detailed errors for each object
      },
    })
    console.log(
      'Deleting character group images from object storage',
      chunk.map((key) => key.Key),
    )
    await s3Client.send(command)
  }
}

export const characterGroupRouter = {
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const groups = await ctx.db
      .select()
      .from(CharGroup)
      .where(eq(CharGroup.userId, ctx.auth.userId))
    return { groups }
  }),

  get: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.query.CharGroup.findFirst({
        where: and(eq(CharGroup.id, input.id), eq(CharGroup.userId, ctx.auth.userId)),
      })
      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character group not found',
        })
      }
      return { group }
    }),

  create: userProtectedProcedure
    .input(
      z.object({
        characters: z.array(z.string()),
        metadata: charGroupMetadataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const metadata = await processMetadata(input.metadata)

      const [group] = await ctx.db
        .insert(CharGroup)
        .values({
          userId: ctx.auth.userId,
          characters: input.characters,
          metadata,
        })
        .returning()
      if (!group) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create character group',
        })
      }

      return { group }
    }),

  update: userProtectedProcedure
    .input(
      z
        .object({
          id: z.string(),
          characters: z.array(z.string()).optional(),
          metadata: makeObjectNonempty(charGroupMetadataSchema).optional(),
        })
        .refine((obj) => obj.characters ?? obj.metadata, 'No fields to update'),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, characters, metadata: partialMetadata } = input

      const group = await ctx.db.query.CharGroup.findFirst({
        where: and(eq(CharGroup.id, id), eq(CharGroup.userId, ctx.auth.userId)),
      })
      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character group not found',
        })
      }

      let metadata
      if (partialMetadata) {
        metadata = await processMetadata({
          ...group.metadata,
          ...partialMetadata,
        })

        if (group.metadata.imageUrl && metadata.imageUrl !== group.metadata.imageUrl) {
          await deleteImage(group.metadata.imageUrl)
        }
      }

      const updates = {
        ...(characters && { characters }),
        ...(metadata && { metadata }),
      }

      const [updatedGroup] = await ctx.db
        .update(CharGroup)
        .set(updates)
        .where(eq(CharGroup.id, id))
        .returning()

      return { group: updatedGroup! }
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [group] = await ctx.db
        .delete(CharGroup)
        .where(and(eq(CharGroup.id, input.id), eq(CharGroup.userId, ctx.auth.userId)))
        .returning()
      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character group not found',
        })
      }

      // Delete the image if it exists
      if (group.metadata.imageUrl) {
        await deleteImage(group.metadata.imageUrl)
      }

      return { group }
    }),

  batchDelete: userProtectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get all character groups that belong to the user and match the provided IDs
      const groups = await ctx.db
        .select()
        .from(CharGroup)
        .where(and(eq(CharGroup.userId, ctx.auth.userId), inArray(CharGroup.id, input.ids)))
      if (groups.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No character groups found',
        })
      }

      // Delete all character groups from database
      await ctx.db
        .delete(CharGroup)
        .where(and(eq(CharGroup.userId, ctx.auth.userId), inArray(CharGroup.id, input.ids)))

      // Delete all images from storage
      const imageUrls = groups
        .map((group) => group.metadata.imageUrl)
        .filter((url): url is string => !!url)
      await deleteImages(imageUrls)

      return { groups }
    }),
}
