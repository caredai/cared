import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@ownxai/db'
import { and, asc, desc, eq, gt, lt } from '@ownxai/db'
import { Chat, CreateChatSchema, UpdateChatSchema } from '@ownxai/db/schema'

import type { Context } from '../trpc'
import { appProtectedProcedure, appUserProtectedProcedure } from '../trpc'
import { getAppById } from './app'

/**
 * Get a chat by ID.
 * @param ctx - The context object
 * @param id - The chat ID
 * @returns The chat if found
 * @throws {TRPCError} If chat not found
 */
export async function getChatById(ctx: Context, id: string) {
  const chat = await ctx.db.query.Chat.findFirst({
    where: eq(Chat.id, id),
  })

  if (!(chat && chat.appId === ctx.auth.appId && chat.userId === ctx.auth.userId)) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Chat with id ${id} not found`,
    })
  }

  return chat
}

export const chatRouter = {
  /**
   * List all chats for an app.
   * Only accessible by authenticated users.
   * @param input - Object containing app ID and pagination parameters
   * @returns List of chats with hasMore flag
   */
  listByApp: appProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/chats',
        protect: true,
        tags: ['chats'],
        summary: 'List all chats for an app',
      },
    })
    .input(
      z
        .object({
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
          orderOn: z.enum(['createdAt', 'updatedAt']).default('updatedAt'),
        })
        .refine((data) => !(data.after && data.before), {
          message: "Cannot use 'after' and 'before' simultaneously",
          path: ['after', 'before'],
        }),
    )
    .query(async ({ ctx, input }) => {
      await getAppById(ctx, ctx.auth.appId)

      const conditions: SQL<unknown>[] = [eq(Chat.appId, ctx.auth.appId)]

      const orderOnUpdatedAt = input.orderOn === 'updatedAt'

      // Add cursor conditions based on direction
      if (input.after) {
        if (orderOnUpdatedAt) {
          conditions.push(gt(Chat.updatedAt, z.coerce.date().parse(input.after)))
        } else {
          conditions.push(gt(Chat.id, input.after))
        }
      }
      if (input.before) {
        if (orderOnUpdatedAt) {
          conditions.push(lt(Chat.updatedAt, z.coerce.date().parse(input.before)))
        } else {
          conditions.push(lt(Chat.id, input.before))
        }
      }

      const chats = await ctx.db.query.Chat.findMany({
        where: and(...conditions),
        orderBy:
          input.order === 'desc'
            ? desc(orderOnUpdatedAt ? Chat.updatedAt : Chat.id)
            : asc(orderOnUpdatedAt ? Chat.updatedAt : Chat.id),
        limit: input.limit + 1,
      })

      const hasMore = chats.length > input.limit
      if (hasMore) {
        chats.pop()
      }

      const first = orderOnUpdatedAt ? chats[0]?.updatedAt.toISOString() : chats[0]?.id
      const last = orderOnUpdatedAt
        ? chats[chats.length - 1]?.updatedAt.toISOString()
        : chats[chats.length - 1]?.id

      return {
        chats,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get a single chat by ID.
   * Only accessible by authenticated users.
   * @param input - The chat ID
   * @returns The chat if found
   */
  byId: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/chats/{id}',
        protect: true,
        tags: ['chats'],
        summary: 'Get a single chat by ID',
      },
    })
    .input(z.object({ id: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      const chat = await getChatById(ctx, input.id)
      return { chat }
    }),

  /**
   * Create a new chat.
   * Only accessible by authenticated users.
   * @param input - The chat data following the {@link CreateChatSchema}
   * @returns The created chat
   */
  create: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/chats',
        protect: true,
        tags: ['chats'],
        summary: 'Create a new chat',
      },
    })
    .input(
      CreateChatSchema.omit({
        appId: true,
        userId: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getAppById(ctx, ctx.auth.appId)

      if (input.debug) {
        // TODO: check rbac

        const existingDebugChat = await ctx.db.query.Chat.findFirst({
          where: and(
            eq(Chat.appId, ctx.auth.appId),
            eq(Chat.userId, ctx.auth.userId),
            eq(Chat.debug, true),
          ),
        })

        if (existingDebugChat) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A debug chat already exists for you in this app',
          })
        }
      }

      const [chat] = await ctx.db
        .insert(Chat)
        .values({
          ...input,
          appId: ctx.auth.appId,
          userId: ctx.auth.userId,
        })
        .returning()

      if (!chat) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create chat',
        })
      }

      return { chat }
    }),

  /**
   * Update an existing chat.
   * Only accessible by authenticated users.
   * @param input - The chat data following the {@link UpdateChatSchema}
   * @returns The updated chat
   */
  update: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/chats/{id}',
        protect: true,
        tags: ['chats'],
        summary: 'Update an existing chat',
      },
    })
    .input(UpdateChatSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...update } = input
      const chat = await getChatById(ctx, id)

      const metadata = update.metadata
        ? {
            ...chat.metadata,
            ...update.metadata,
          }
        : undefined

      const [updatedChat] = await ctx.db
        .update(Chat)
        .set({
          ...update,
          metadata,
          ...(Object.keys(update).length === 0 && { updatedAt: new Date() }),
        })
        .where(eq(Chat.id, id))
        .returning()
      if (!updatedChat) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update chat',
        })
      }

      return { chat: updatedChat }
    }),

  /**
   * Delete an existing chat.
   * Only accessible by authenticated users.
   * @param input - Object containing the chat ID to delete
   * @returns The deleted chat
   */
  delete: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/chats/{id}',
        protect: true,
        tags: ['chats'],
        summary: 'Delete an existing chat',
      },
    })
    .input(z.object({ id: z.string().min(32) }))
    .mutation(async ({ ctx, input }) => {
      await getChatById(ctx, input.id)

      const [deletedChat] = await ctx.db.delete(Chat).where(eq(Chat.id, input.id)).returning()

      if (!deletedChat) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete chat',
        })
      }

      return { chat: deletedChat }
    }),
}
