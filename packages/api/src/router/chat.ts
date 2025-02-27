import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@mindworld/db'
import { and, desc, eq, gt, gte, lt } from '@mindworld/db'
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
import { getAppById } from './app'

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
   * @param input - The chat ID
   * @returns The chat if found
   */
  byId: protectedProcedure.input(z.string().min(32)).query(async ({ ctx, input }) => {
    const chat = await getChatById(ctx, input)
    return { chat }
  }),

  /**
   * Create a new chat.
   * Only accessible by authenticated users.
   * @param input - The chat data following the {@link CreateChatSchema}
   * @returns The created chat
   */
  create: protectedProcedure.input(CreateChatSchema).mutation(async ({ ctx, input }) => {
    await getAppById(ctx, input.appId)

    if (input.debug) {
      // TODO: check rbac

      const existingDebugChat = await ctx.db.query.Chat.findFirst({
        where: and(
          eq(Chat.appId, input.appId),
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

    const [chat] = await ctx.db.insert(Chat).values(input).returning()

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
   * Delete an existing chat.
   * Only accessible by authenticated users.
   * @param input - Object containing the chat ID to delete
   * @returns The deleted chat
   */
  delete: protectedProcedure.input(z.string().min(32)).mutation(async ({ ctx, input }) => {
    await getChatById(ctx, input)

    const [deletedChat] = await ctx.db.delete(Chat).where(eq(Chat.id, input)).returning()

    if (!deletedChat) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete chat',
      })
    }

    return { chat: deletedChat }
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
  getMessage: protectedProcedure.input(z.string().min(32)).query(async ({ ctx, input }) => {
    const message = await getMessageById(ctx, input)
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

    if (input.id) {
      const lastMsg = await ctx.db.query.Message.findFirst({
        where: eq(Message.chatId, input.chatId),
        orderBy: desc(Message.id),
      })

      if (lastMsg && input.id <= lastMsg.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Message ID must be greater than the last message ID in the chat',
        })
      }
    }

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
   * Create multiple messages in a chat.
   * Only accessible by authenticated users.
   * @param input - Array of message data following the {@link CreateMessageSchema}
   * @returns The created messages
   */
  createMessages: protectedProcedure
    .input(z.array(CreateMessageSchema))
    .mutation(async ({ ctx, input }) => {
      const firstMsg = input.at(0)
      if (!firstMsg) {
        return { messages: [] }
      }

      // Verify chat exists and user has access
      await getChatById(ctx, firstMsg.chatId)

      // Verify all messages are for same chat
      if (!input.every((msg) => msg.chatId === firstMsg.chatId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'All messages must belong to the same chat',
        })
      }

      if (firstMsg.id) {
        // If first message has ID, verify all messages have IDs
        if (!input.every((msg) => msg.id)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'If first message has ID, all messages must have IDs',
          })
        }

        // Check IDs are in ascending order
        for (let i = 1; i < input.length; i++) {
          if (input[i]!.id! <= input[i - 1]!.id!) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Message IDs must be in ascending order',
            })
          }
        }

        // Verify first message ID is greater than the last message ID in database
        const lastMsg = await ctx.db.query.Message.findFirst({
          where: eq(Message.chatId, firstMsg.chatId),
          orderBy: [desc(Message.id)],
        })

        if (lastMsg && firstMsg.id <= lastMsg.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'First message ID must be greater than the last message ID in chat',
          })
        }
      } else {
        // If first message has no ID, verify all messages have no IDs
        if (input.some((msg) => msg.id)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'If first message has no ID, all messages must have no IDs',
          })
        }
      }

      const messages = await ctx.db.insert(Message).values(input).returning()

      if (!messages.length) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create messages',
        })
      }

      return { messages }
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

      const messages = await ctx.db
        .delete(Message)
        .where(and(eq(Message.chatId, message.chatId), gte(Message.id, message.id)))
        .returning()

      return { messages }
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
