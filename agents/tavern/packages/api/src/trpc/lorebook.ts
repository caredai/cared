import path from 'path'
import type { LorebookContent, LorebookEntry } from '@tavern/core'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { lorebookContentSchema, lorebookEntrySchema } from '@tavern/core'
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
        content: lorebookContentSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [lorebook] = await ctx.db
        .insert(Lorebook)
        .values({
          userId: ctx.auth.userId,
          content: input.content,
        })
        .returning()
      return { lorebook: lorebook! }
    }),

  update: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        updateName: z.string().optional(),
        updateDescription: z.string().optional(),
        addEntries: z.array(lorebookEntrySchema).optional(),
        updateEntries: z
          .array(
            lorebookEntrySchema.extend({
              index: z.number().int().nonnegative(),
            }),
          )
          .optional(),
        removeEntries: z
          .array(
            z.object({
              index: z.number().int().nonnegative(),
            }),
          )
          .optional(),
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
      const content = lorebook.content
      if (input.updateName) {
        content.name = input.updateName
      }
      if (input.updateDescription) {
        content.description = input.updateDescription || undefined
      }
      if (input.addEntries) {
        content.entries.push(...input.addEntries)
      }
      if (input.updateEntries) {
        for (const { index, ...entry } of input.updateEntries) {
          if (index >= content.entries.length) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Index out of range: ${index}`,
            })
          }
          content.entries[index] = entry
        }
      }
      if (input.removeEntries) {
        const removeEntries = new Set(input.removeEntries.map((entry) => entry.index))
        const entries: LorebookEntry[] = []
        for (let i = 0; i < content.entries.length; i++) {
          if (!removeEntries.has(i)) {
            entries.push(content.entries[i]!)
          }
        }
        content.entries = entries
      }

      const [updatedLorebook] = await ctx.db
        .update(Lorebook)
        .set({
          content: content,
        })
        .where(eq(Lorebook.id, input.id))
        .returning()

      return { lorebook: updatedLorebook! }
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

      return { lorebook }
    }),
}
