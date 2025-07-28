import { charGroupMetadataSchema } from '@tavern/core'
import { CharGroup, CharGroupChat } from '@tavern/db/schema'
import { TRPCError } from '@trpc/server'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'

import { makeObjectNonempty } from '@cared/sdk'

import { createCaredClient } from '../cared'
import { userProtectedProcedure } from '../trpc'
import { deleteImage, deleteImages, uploadImage } from './utils'

async function processMetadata(metadata: z.infer<typeof charGroupMetadataSchema>) {
  if (metadata.imageUrl?.startsWith('data:')) {
    const imageUrl = await uploadImage(metadata.imageUrl, {
      name: metadata.name,
      prefix: 'character-groups',
    })
    return {
      ...metadata,
      imageUrl,
    }
  }
  return metadata
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
      // Find all chats associated with this character group
      const groupChats = await ctx.db
        .select({ chatId: CharGroupChat.chatId })
        .from(CharGroupChat)
        .where(and(eq(CharGroupChat.groupId, input.id), eq(CharGroupChat.userId, ctx.auth.userId)))

      // Batch delete associated chats if any
      if (groupChats.length > 0) {
        const cared = createCaredClient(ctx)
        const caredTrpc = cared.trpc

        const chatIds = groupChats.map((gc) => gc.chatId)

        // Delete chats in batches of 100
        for (let i = 0; i < chatIds.length; i += 100) {
          await caredTrpc.chat.batchDelete.mutate({
            ids: chatIds.slice(i, i + 100),
          })
        }
      }

      // Delete the character group from database
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

      // Find all chats associated with these character groups
      const groupChats = await ctx.db
        .select({ chatId: CharGroupChat.chatId })
        .from(CharGroupChat)
        .where(
          and(inArray(CharGroupChat.groupId, input.ids), eq(CharGroupChat.userId, ctx.auth.userId)),
        )

      // Batch delete associated chats if any
      if (groupChats.length > 0) {
        const cared = createCaredClient(ctx)
        const caredTrpc = cared.trpc

        const chatIds = groupChats.map((gc) => gc.chatId)

        // Delete chats in batches of 100
        for (let i = 0; i < chatIds.length; i += 100) {
          await caredTrpc.chat.batchDelete.mutate({
            ids: chatIds.slice(i, i + 100),
          })
        }
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
