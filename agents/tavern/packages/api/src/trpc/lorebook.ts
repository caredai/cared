import path from 'path'
import type { LorebookContent } from '@tavern/core'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { lorebookEntrySchema, lorebookUpdatesSchema, updateLorebook } from '@tavern/core'
import { and, eq } from '@tavern/db'
import { Lorebook } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'
import { z } from 'zod'

import { env } from '../env'
import { s3Client } from '../s3'
import { userProtectedProcedure } from '../trpc'

export async function uploadLorebook(content: LorebookContent) {
  let name = content.name
  name = name.endsWith('.json') ? name : `${name}.json`
  const key = `lorebooks/${uuid()}/${sanitize(name)}`
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: JSON.stringify(content),
    ContentType: 'application/json',
  })
  await s3Client.send(command)
  return path.posix.join(env.S3_BUCKET, key)
}

export const lorebookRouter = {
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const lorebooks = await ctx.db.query.Lorebook.findMany({
      // Omit `entries` field since it may be too big.
      columns: {
        id: true,
        userId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      where: eq(Lorebook.userId, ctx.auth.userId),
    })
    return { lorebooks }
  }),

  get: userProtectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const lorebook = await ctx.db.query.Lorebook.findFirst({
      where: and(eq(Lorebook.id, input.id), eq(Lorebook.userId, ctx.auth.userId)),
    })
    return { lorebook }
  }),

  create: userProtectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        entries: z.array(lorebookEntrySchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [lorebook] = await ctx.db
        .insert(Lorebook)
        .values({
          userId: ctx.auth.userId,
          name: input.name,
          description: input.description,
          entries: input.entries ?? [],
        })
        .returning()
      return { lorebook: lorebook! }
    }),

  update: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        updates: lorebookUpdatesSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lorebook = await ctx.db.query.Lorebook.findFirst({
        where: and(eq(Lorebook.id, input.id), eq(Lorebook.userId, ctx.auth.userId)),
      })
      if (!lorebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lorebook not found',
        })
      }

      const result = updateLorebook(lorebook, input.updates)
      if (result.error || !result.updates) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
        })
      }

      await ctx.db.update(Lorebook).set(result.updates).where(eq(Lorebook.id, input.id))

      // Do not return lorebook here
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [lorebook] = await ctx.db.delete(Lorebook).where(eq(Lorebook.id, input.id)).returning()
      if (!lorebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lorebook not found',
        })
      }
    }),
}
