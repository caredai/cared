import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { SQL } from '@ownxai/db'
import { and, asc, desc, eq, gt, gte, inArray, lt } from '@ownxai/db'
import {
  CreateMessageSchema,
  CreateMessageVoteSchema,
  Message,
  messageContentSchema,
  MessageVote,
} from '@ownxai/db/schema'

import type { Context } from '../trpc'
import { cfg } from '../config'
import { userProtectedProcedure } from '../trpc'
import { getChatById } from './chat'

async function findMessageById(ctx: Context, id: string) {
  return await ctx.db.query.Message.findFirst({
    where: eq(Message.id, id),
  })
}

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

export const messageRouter = {
  /**
   * List all messages in a chat.
   * Only accessible by authenticated users.
   * @param input - Object containing chat ID and pagination parameters
   * @returns List of messages with hasMore flag and pagination metadata
   */
  list: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/messages',
        protect: true,
        tags: ['chats'],
        summary: 'List all messages in a chat',
      },
    })
    .input(
      z
        .object({
          chatId: z.string().min(32),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(cfg.perChat.maxMessages).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine((data) => !(data.after && data.before), {
          message: "Cannot use 'after' and 'before' simultaneously",
          path: ['after', 'before'],
        }),
    )
    .query(async ({ ctx, input }) => {
      await getChatById(ctx, input.chatId)

      const conditions: SQL<unknown>[] = [eq(Message.chatId, input.chatId)]

      // Add cursor conditions based on direction
      if (input.after) {
        conditions.push(gt(Message.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Message.id, input.before))
      }

      const messages = await ctx.db.query.Message.findMany({
        where: and(...conditions),
        orderBy: input.order === 'desc' ? desc(Message.id) : asc(Message.id),
        limit: input.limit + 1,
      })

      const hasMore = messages.length > input.limit
      if (hasMore) {
        messages.pop()
      }

      // Get first and last message IDs
      const first = messages[0]?.id
      const last = messages[messages.length - 1]?.id

      return {
        messages,
        hasMore,
        first,
        last,
      }
    }),

  find: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/messages/{id}',
        protect: true,
        tags: ['chats'],
        summary: 'Get a single message by ID',
      },
    })
    .input(z.object({ id: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      // TODO: check authorization
      const message = await findMessageById(ctx, input.id)
      return { message }
    }),

  /**
   * Get a single message by ID.
   * Only accessible by authenticated users.
   * @param input - Object containing message ID
   * @returns The message if found
   */
  get: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/messages/{id}',
        protect: true,
        tags: ['chats'],
        summary: 'Get a single message by ID',
      },
    })
    .input(z.object({ id: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      // TODO: check authorization
      const message = await getMessageById(ctx, input.id)
      return { message }
    }),

  /**
   * Create a new message in a chat.
   * Only accessible by authenticated users.
   * @param input - The message data following the {@link CreateMessageSchema}
   * @returns The created message
   */
  create: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/messages',
        protect: true,
        tags: ['chats'],
        summary: 'Create a new message in a chat',
      },
    })
    .input(CreateMessageSchema)
    .mutation(async ({ ctx, input }) => {
      await getChatById(ctx, input.chatId)

      let parent: Message | undefined
      if (input.parentId) {
        parent = await ctx.db.query.Message.findFirst({
          where: and(eq(Message.chatId, input.chatId), eq(Message.id, input.parentId)),
        })
        if (!parent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Parent message not found',
          })
        }
      } else {
        // If no parentId is provided, get the last (newest) message in the chat.
        // Only empty for the first message to be created.
        parent = await ctx.db.query.Message.findFirst({
          where: eq(Message.chatId, input.chatId),
          orderBy: desc(Message.id),
        })
        input.parentId = parent?.id
      }

      if (input.id && input.parentId && input.id <= input.parentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Message ID must be greater than the parent message ID in the chat',
        })
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
   * Update a message's content.
   * Only accessible by authenticated users.
   * @param input - Object containing message ID and new content
   * @returns The updated message
   */
  update: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH', // Using PATCH as we are partially updating the resource
        path: '/v1/messages/{id}',
        protect: true,
        tags: ['chats'],
        summary: 'Update a message content',
      },
    })
    .input(
      z.object({
        id: z.string().min(32),
        content: messageContentSchema.optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await getMessageById(ctx, input.id)

      const [updatedMessage] = await ctx.db
        .update(Message)
        .set({
          ...(input.content && { content: input.content }),
          ...(input.metadata && { metadata: input.metadata }),
        })
        .where(eq(Message.id, message.id))
        .returning()

      if (!updatedMessage) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update message',
        })
      }

      return { message: updatedMessage }
    }),

  /**
   * Delete messages in a chat based on the specified message ID.
   * Only accessible by authenticated users.
   * @param input - Object containing:
   *   - id: Message ID to start deletion from
   *   - deleteTrailing: Optional flag to delete all messages after the specified message
   *   - excludeSelf: Optional flag to exclude the specified message from deletion
   * @returns Object containing array of deleted messages
   */
  delete: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/messages/{id}',
        protect: true,
        tags: ['chats'],
        summary: 'Delete messages in a chat based on the specified message ID',
      },
    })
    .input(
      z.object({
        id: z.string().min(32),
        deleteTrailing: z.boolean().optional(),
        excludeSelf: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await getMessageById(ctx, input.id)

      // First, find all messages that are descendants of the specified message
      const descendantMessages = await ctx.db.query.Message.findMany({
        where: and(
          eq(Message.chatId, message.chatId),
          (input.excludeSelf ? gt : gte)(Message.id, message.id),
        ),
      })
      if (!descendantMessages.length) {
        return {
          messages: [],
        }
      }

      // Create a map of parentId to children for efficient lookup
      const parentToChildren = new Map<string, string[]>()
      descendantMessages.forEach((msg) => {
        if (msg.parentId) {
          if (!parentToChildren.has(msg.parentId)) {
            parentToChildren.set(msg.parentId, [])
          }
          parentToChildren.get(msg.parentId)!.push(msg.id)
        }
      })

      // Recursively collect all descendant message IDs
      const descendantIds = new Set<string>()
      const collectDescendants = (msgId: string) => {
        descendantIds.add(msgId)
        const children = parentToChildren.get(msgId) ?? []
        children.forEach((childId) => collectDescendants(childId))
      }
      collectDescendants(message.id)

      if (!descendantIds.size) {
        return {
          messages: [],
        }
      }

      // Delete all descendant messages
      const messages = await ctx.db
        .delete(Message)
        .where(
          and(eq(Message.chatId, message.chatId), inArray(Message.id, Array.from(descendantIds))),
        )
        .returning()

      return { messages }
    }),

  /**
   * Vote on a message.
   * Only accessible by authenticated users.
   * @param input - The vote data following the {@link CreateMessageVoteSchema}
   * @returns The created or updated vote
   */
  vote: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/messages/vote',
        protect: true,
        tags: ['chats'],
        summary: 'Vote on a message',
      },
    })
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
