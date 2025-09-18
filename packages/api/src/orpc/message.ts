import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { and, asc, count, desc, eq, gt, gte, inArray, lt } from '@cared/db'
import {
  CreateMessageSchema,
  CreateMessageVoteSchema,
  Message,
  messageContentSchema,
  MessageVote,
} from '@cared/db/schema'

import type { BaseContext } from '../orpc'
import { appUserProtectedProcedure } from '../orpc'
import { getChatById } from './chat'

async function findMessageById(ctx: BaseContext, id: string) {
  return await ctx.db.query.Message.findFirst({
    where: eq(Message.id, id),
  })
}

async function getMessageById(ctx: BaseContext, id: string) {
  const message = await ctx.db.query.Message.findFirst({
    where: eq(Message.id, id),
  })

  if (!message) {
    throw new ORPCError('NOT_FOUND', {
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
  list: appUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/messages',
      tags: ['chats'],
      summary: 'List all messages in a chat',
    })
    .input(
      z
        .object({
          chatId: z.string().min(32),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(1000).default(50),
          order: z.enum(['desc', 'asc']).default('desc'),
        })
        .refine((data) => !(data.after && data.before), {
          message: "Cannot use 'after' and 'before' simultaneously",
          path: ['after', 'before'],
        }),
    )
    .handler(async ({ context, input }) => {
      await getChatById(context, input.chatId)

      const conditions: SQL<unknown>[] = [eq(Message.chatId, input.chatId)]

      // Add cursor conditions based on direction
      if (input.after) {
        conditions.push(gt(Message.id, input.after))
      }
      if (input.before) {
        conditions.push(lt(Message.id, input.before))
      }

      const messages = await context.db.query.Message.findMany({
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

  /**
   * List messages by their IDs within a specific chat.
   * Only accessible by authenticated users.
   * @param input - Object containing chat ID and array of message IDs
   * @returns List of messages found by the provided IDs in the specified chat
   */
  listByIds: appUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/messages/list-by-ids',
      tags: ['chats'],
      summary: 'List messages by their IDs within a specific chat',
    })
    .input(
      z.object({
        chatId: z.string().min(32),
        ids: z.array(z.string().min(32)).min(1).max(1000),
      }),
    )
    .handler(async ({ context, input }) => {
      await getChatById(context, input.chatId)

      const messages = await context.db.query.Message.findMany({
        where: and(eq(Message.chatId, input.chatId), inArray(Message.id, input.ids)),
      })

      return { messages }
    }),

  find: appUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/messages/{id}',
      tags: ['chats'],
      summary: 'Get a single message by ID',
    })
    .input(z.object({ id: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      // TODO: check authorization
      const message = await findMessageById(context, input.id)
      return { message }
    }),

  /**
   * Get a single message by ID.
   * Only accessible by authenticated users.
   * @param input - Object containing message ID
   * @returns The message if found
   */
  get: appUserProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/messages/{id}',
      tags: ['chats'],
      summary: 'Get a single message by ID',
    })
    .input(z.object({ id: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      // TODO: check authorization
      const message = await getMessageById(context, input.id)
      return { message }
    }),

  /**
   * Create a new message in a chat.
   * Only accessible by authenticated users.
   * @param input - The message data following the {@link CreateMessageSchema}
   * @returns The created message
   */
  create: appUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/messages',
      tags: ['chats'],
      summary: 'Create a new message in a chat',
    })
    .input(
      CreateMessageSchema.extend({
        isRoot: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await getChatById(context, input.chatId)

      let parent: Message | undefined
      if (input.parentId) {
        if (input.isRoot) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Cannot specify parentId for root messages',
          })
        }

        parent = await context.db.query.Message.findFirst({
          where: and(eq(Message.chatId, input.chatId), eq(Message.id, input.parentId)),
        })
        if (!parent) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Parent message not found',
          })
        }
      } else if (!input.isRoot) {
        // If no parentId is provided, get the last (newest) message in the chat.
        // Only empty for the root message to be created.
        parent = await context.db.query.Message.findFirst({
          where: eq(Message.chatId, input.chatId),
          orderBy: desc(Message.id),
        })
        input.parentId = parent?.id
      }

      if (input.id && input.parentId && input.id <= input.parentId) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Message ID must be greater than the parent message ID in the chat',
        })
      }

      const [message] = await context.db.insert(Message).values(input).returning()

      if (!message) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
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
  update: appUserProtectedProcedure
    .route({
      method: 'PATCH', // Using PATCH as we are partially updating the resource
      path: '/v1/messages/{id}',
      tags: ['chats'],
      summary: 'Update a message content',
    })
    .input(
      z.object({
        id: z.string().min(32),
        content: messageContentSchema.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const message = await getMessageById(context, input.id)

      const [updatedMessage] = await context.db
        .update(Message)
        .set({
          ...(input.content && { content: input.content }),
        })
        .where(eq(Message.id, message.id))
        .returning()

      if (!updatedMessage) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to update message',
        })
      }

      return { message: updatedMessage }
    }),

  /**
   * Delete messages in a chat based on the specified message ID.
   * Only accessible by authenticated users.
   * @param input - Object containing:
   *   - id: Message ID to delete
   *   - deleteTrailing: Optional flag to delete all messages after the specified message
   *   - excludeSelf: Optional flag to exclude the specified message from deletion
   * @returns Object containing array of deleted messages
   */
  delete: appUserProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/messages/{id}',
      tags: ['chats'],
      summary: 'Delete messages in a chat based on the specified message ID',
    })
    .input(
      z
        .object({
          id: z.string().min(32),
          deleteTrailing: z.boolean().optional(),
          excludeSelf: z.boolean().optional(),
        })
        .refine((data) => !data.excludeSelf || data.deleteTrailing, {
          message: 'excludeSelf can only be specified when deleteTrailing is true',
          path: ['excludeSelf'],
        }),
    )
    .handler(async ({ context, input }) => {
      const message = await getMessageById(context, input.id)

      // If deleteTrailing is not set, only delete the specified message
      if (!input.deleteTrailing) {
        return await context.db.transaction(async (tx) => {
          // Check if there are direct child messages that need parentId update
          const directChildrenCount = await tx
            .select({ count: count() })
            .from(Message)
            .where(and(eq(Message.chatId, message.chatId), eq(Message.parentId, message.id)))
            .then((result) => result[0]?.count ?? 0)

          if (directChildrenCount > 1 && !message.parentId) {
            throw new ORPCError('BAD_REQUEST', {
              message:
                'Cannot delete a root message without deleting its descendant messages (multiple descendant messages exist)',
            })
          }

          // Update parentId of direct children to point to the deleted message's parent
          if (directChildrenCount > 0) {
            await tx
              .update(Message)
              .set({ parentId: message.parentId })
              .where(and(eq(Message.chatId, message.chatId), eq(Message.parentId, message.id)))
          }

          // Delete the specified message
          const [deletedMessage] = await tx
            .delete(Message)
            .where(eq(Message.id, message.id))
            .returning()

          return { messages: [deletedMessage] }
        })
      }

      // First, find all messages that are descendants of the specified message
      const descendantMessages = await context.db.query.Message.findMany({
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
      const messages = await context.db
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
  vote: appUserProtectedProcedure
    .route({
      method: 'POST',
      path: '/v1/messages/vote',
      tags: ['chats'],
      summary: 'Vote on a message',
    })
    .input(CreateMessageVoteSchema)
    .handler(async ({ context, input }) => {
      await getMessageById(context, input.messageId)

      const [vote] = await context.db
        .insert(MessageVote)
        .values(input)
        .onConflictDoUpdate({
          target: [MessageVote.chatId, MessageVote.messageId],
          set: { isUpvoted: input.isUpvoted },
        })
        .returning()

      if (!vote) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to create or update vote',
        })
      }

      return { vote }
    }),
}
