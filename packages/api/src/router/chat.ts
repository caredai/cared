import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { and, desc, eq, gt, gte, lt, SQL } from '@mindworld/db'
import {
  Chat,
  CreateChatSchema,
  CreateMessageSchema,
  CreateMessageVoteSchema,
  Message,
  MessageVote,
  UpdateChatSchema,
} from '@mindworld/db/schema'

import type { Context } from '../trpc'
import { protectedProcedure } from '../trpc'
import { getAppById, getAppVersion } from './app'

/**
 * Get a chat by ID.
 * @param ctx - The context object
 * @param id - The chat ID
 * @returns The chat if found
 * @throws {TRPCError} If chat not found
 */
async function getChatById(ctx: Context, id: string) {
  const chat = await ctx.db.query.Chat.findFirst({
    where: eq(Chat.id, id),
  })

  if (!chat) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Chat with id ${id} not found`,
    })
  }

  return chat
}

/**
 * Get a message by ID.
 * @param ctx - The context object
 * @param id - The message ID
 * @returns The message if found
 * @throws {TRPCError} If message not found
 */
async function getMessageById(ctx: Context, id: string) {
  const message = await ctx.db.query.Message.findFirst({
    where: eq(Message.id, id),
  })

  if (!message) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Message with id ${id} not found`,
    })
  }

  return message
}

export const chatRouter = {
  /**
   * List all chats for an app.
   * Only accessible by authenticated users.
   * @param input - Object containing app ID and pagination parameters
   * @returns List of chats with hasMore flag
   */
  listByApp: protectedProcedure
    .input(
      z.object({
        appId: z.string().min(32),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAppById(ctx, input.appId)

      const conditions: SQL<unknown>[] = [eq(Chat.appId, input.appId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(Chat.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Chat.id, input.before))
      }

      const chats = await ctx.db.query.Chat.findMany({
        where: and(...conditions),
        orderBy: desc(Chat.id),
        limit: input.limit + 1,
      })

      const hasMore = chats.length > input.limit
      if (hasMore) {
        chats.pop()
      }

      return {
        chats,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * Get a single chat by ID.
   * Only accessible by authenticated users.
   * @param input - Object containing chat ID
   * @returns The chat if found
   */
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string().min(32),
      }),
    )
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
  create: protectedProcedure
    .input(
      CreateChatSchema.extend({
        appVersion: z
          .number()
          .int()
          .or(z.enum(['latest', 'draft']))
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getAppById(ctx, input.appId)

      const appVersion = await getAppVersion(ctx, input.appId, input.appVersion)

      const [chat] = await ctx.db
        .insert(Chat)
        .values({
          ...input,
          appVersion: appVersion.version,
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
  update: protectedProcedure.input(UpdateChatSchema).mutation(async ({ ctx, input }) => {
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
   * List all messages in a chat.
   * Only accessible by authenticated users.
   * @param input - Object containing chat ID and pagination parameters
   * @returns List of messages with hasMore flag
   */
  listMessages: protectedProcedure
    .input(
      z.object({
        chatId: z.string().min(32),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getChatById(ctx, input.chatId)

      const conditions: SQL<unknown>[] = [eq(Message.chatId, input.chatId)]

      // Add cursor conditions
      if (input.after) {
        conditions.push(gt(Message.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Message.id, input.before))
      }

      const messages = await ctx.db.query.Message.findMany({
        where: and(...conditions),
        orderBy: desc(Message.id),
        limit: input.limit + 1,
      })

      const hasMore = messages.length > input.limit
      if (hasMore) {
        messages.pop()
      }

      return {
        messages,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * Get a single message by ID.
   * Only accessible by authenticated users.
   * @param input - Object containing message ID
   * @returns The message if found
   */
  getMessage: protectedProcedure
    .input(
      z.object({
        id: z.string().min(32),
      }),
    )
    .query(async ({ ctx, input }) => {
      const message = await getMessageById(ctx, input.id)
      return { message }
    }),

  /**
   * Create a new message in a chat.
   * Only accessible by authenticated users.
   * @param input - The message data following the {@link CreateMessageSchema}
   * @returns The created message
   */
  createMessage: protectedProcedure.input(CreateMessageSchema).mutation(async ({ ctx, input }) => {
    await getChatById(ctx, input.chatId)

    const [message] = await ctx.db.insert(Message).values(input).returning()

    if (!message) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create message',
      })
    }

    return { message }
  }),

  /**
   * Delete all messages in a chat that were created after the specified message.
   * Only accessible by authenticated users.
   * @param input - Object containing message ID
   */
  deleteTrailingMessages: protectedProcedure
    .input(
      z.object({
        messageId: z.string().min(32),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await getMessageById(ctx, input.messageId)

      await ctx.db
        .delete(Message)
        .where(and(eq(Message.chatId, message.chatId), gte(Message.createdAt, message.createdAt)))

      return { success: true }
    }),

  /**
   * Vote on a message.
   * Only accessible by authenticated users.
   * @param input - The vote data following the {@link CreateMessageVoteSchema}
   * @returns The created or updated vote
   */
  voteMessage: protectedProcedure
    .input(CreateMessageVoteSchema)
    .mutation(async ({ ctx, input }) => {
      await getMessageById(ctx, input.messageId)

      const [vote] = await ctx.db
        .insert(MessageVote)
        .values(input)
        .onConflictDoUpdate({
          target: [MessageVote.chatId, MessageVote.messageId],
          set: { isUpvoted: input.isUpvoted },
        })
        .returning()

      if (!vote) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create or update vote',
        })
      }

      return { vote }
    }),
}
