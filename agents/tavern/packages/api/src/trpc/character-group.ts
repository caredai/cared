import { charGroupMetadataSchema } from '@tavern/core'
import { CharGroup } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { makeObjectNonempty } from '@ownxai/sdk'

import { userProtectedProcedure } from '../trpc'

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
        characters: z.array(z.string()).min(1),
        metadata: charGroupMetadataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [group] = await ctx.db
        .insert(CharGroup)
        .values({
          userId: ctx.auth.userId,
          characters: input.characters,
          metadata: input.metadata,
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
          characters: z.array(z.string()).min(1).optional(),
          metadata: makeObjectNonempty(charGroupMetadataSchema).optional(),
        })
        .refine((obj) => obj.characters ?? obj.metadata, 'No fields to update'),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, characters, metadata } = input

      const group = await ctx.db.query.CharGroup.findFirst({
        where: and(eq(CharGroup.id, id), eq(CharGroup.userId, ctx.auth.userId)),
      })
      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Character group not found',
        })
      }

      const updates = {
        ...(characters && { characters }),
        ...(metadata && {
          metadata: {
            ...group.metadata,
            ...metadata,
          },
        }),
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

      return { groups }
    }),
}
