import path from 'path'
import type { LorebookContent } from '@tavern/core'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { lorebookEntriesSchema, lorebookEntrySchema } from '@tavern/core'
import { and, desc, eq } from '@tavern/db'
import { Lorebook } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'
import { z } from 'zod/v4'

import { env } from '../env'
import { s3Client } from '../s3'
import { userProtectedProcedure } from '../trpc'
import { omitUserId } from '../utils'

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
  list: userProtectedProcedure
    .input(
      z
        .object({
          includeEntries: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const lorebooks = await ctx.db.query.Lorebook.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
          // Default to omitting `entries` field since it may be too big.
          entries: !!input?.includeEntries,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
        where: eq(Lorebook.userId, ctx.auth.userId),
        orderBy: desc(Lorebook.id),
      })
      return { lorebooks } as {
        lorebooks: (Omit<Lorebook, 'userId' | 'entries'> & Partial<Pick<Lorebook, 'entries'>>)[]
      }
    }),

  get: userProtectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const lorebook = await ctx.db.query.Lorebook.findFirst({
      where: and(eq(Lorebook.id, input.id), eq(Lorebook.userId, ctx.auth.userId)),
    })
    if (!lorebook) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Lorebook not found',
      })
    }
    return { lorebook: omitUserId(lorebook) }
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
      return { lorebook: omitUserId(lorebook!) }
    }),

  update: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        entries: lorebookEntriesSchema.optional(),
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

      const updates = {
        ...(input.name && { name: input.name }),
        ...(input.entries && {
          entries: input.entries,
        }),
      }

      await ctx.db.update(Lorebook).set(updates).where(eq(Lorebook.id, input.id))

      // Do not return lorebook here since it may be too big.
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [lorebook] = await ctx.db
        .delete(Lorebook)
        .where(and(eq(Lorebook.id, input.id), eq(Lorebook.userId, ctx.auth.userId)))
        .returning()
      if (!lorebook) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lorebook not found',
        })
      }
    }),
}
