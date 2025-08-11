import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@cared/db'
import { and, asc, desc, eq, gt, inArray, lt } from '@cared/db'
import {
  Chat,
  CreateChatSchema,
  CreateMessageSchema,
  generateMessageId,
  Message,
  UpdateChatSchema,
} from '@cared/db/schema'

import type { AppUserContext } from '../trpc'
import { appUserProtectedProcedure } from '../trpc'
import { getAppById } from './app'

/**
 * Get a chat by ID.
 * @param ctx - The context object
 * @param id - The chat ID
 * @returns The chat if found
 * @throws {TRPCError} If chat not found
 */
export async function getChatById(ctx: AppUserContext, id: string) {
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
   * List all chats for a user in an app.
   * Only accessible by authenticated users.
   * @param input - Object pagination parameters
   * @returns List of chats with hasMore flag
   */
  list: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/chats',
        protect: true,
        tags: ['chats'],
        summary: 'List all chats',
      },
    })
    .input(
      z
        .object({
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          orderBy: z.enum(['desc', 'asc']).default('desc'),
          orderOn: z.enum(['createdAt', 'updatedAt']).default('updatedAt'),
          includeLastMessage: z.boolean().default(false),
        })
        .refine((data) => !(data.after && data.before), {
          message: "Cannot use 'after' and 'before' simultaneously",
          path: ['after', 'before'],
        }),
    )
    .query(async ({ ctx, input }) => {
      await getAppById(ctx, ctx.auth.appId)

      const conditions: SQL<unknown>[] = [
        eq(Chat.userId, ctx.auth.userId),
        eq(Chat.appId, ctx.auth.appId),
      ]

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
          input.orderBy === 'desc'
            ? desc(orderOnUpdatedAt ? Chat.updatedAt : Chat.id)
            : asc(orderOnUpdatedAt ? Chat.updatedAt : Chat.id),
        limit: input.limit + 1,
        with: input.includeLastMessage
          ? {
              messages: {
                orderBy: [desc(Message.id)],
                limit: 1,
              },
            }
          : undefined,
      })

      const hasMore = chats.length > input.limit
      if (hasMore) {
        chats.pop()
      }

      // Transform the result to include the last message if requested
      const transformedChats = chats.map((chat) => ({
        ...chat,
        lastMessage: input.includeLastMessage
          ? ((chat as any).messages as Message[])[0]
          : undefined,
      }))

      const first = orderOnUpdatedAt ? chats[0]?.updatedAt.toISOString() : chats[0]?.id
      const last = orderOnUpdatedAt
        ? chats[chats.length - 1]?.updatedAt.toISOString()
        : chats[chats.length - 1]?.id

      return {
        chats: transformedChats,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Get multiple chats by their IDs.
   * Only accessible by authenticated users.
   * @param input - Object containing array of chat IDs and includeLastMessage flag
   * @returns Array of chats that belong to the user and app
   */
  listByIds: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/chats/list-by-ids',
        protect: true,
        tags: ['chats'],
        summary: 'Get multiple chats by their IDs',
      },
    })
    .input(
      z.object({
        ids: z.array(z.string().min(32)).min(1).max(100),
        includeLastMessage: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAppById(ctx, ctx.auth.appId)

      const chats = await ctx.db.query.Chat.findMany({
        where: and(
          eq(Chat.appId, ctx.auth.appId),
          eq(Chat.userId, ctx.auth.userId),
          inArray(Chat.id, input.ids),
        ),
        with: input.includeLastMessage
          ? {
              messages: {
                orderBy: [desc(Message.id)],
                limit: 1,
              },
            }
          : undefined,
      })

      // Transform the result to include the last message if requested
      const transformedChats = chats.map((chat) => ({
        ...chat,
        lastMessage: input.includeLastMessage
          ? ((chat as any).messages as Message[])[0]
          : undefined,
      }))

      return { chats: transformedChats }
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
    .input(
      z.object({
        id: z.string().min(32),
        includeLastMessage: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const chat = await ctx.db.query.Chat.findFirst({
        where: and(
          eq(Chat.id, input.id),
          eq(Chat.appId, ctx.auth.appId),
          eq(Chat.userId, ctx.auth.userId),
        ),
        with: input.includeLastMessage
          ? {
              messages: {
                orderBy: [desc(Message.id)],
                limit: 1,
              },
            }
          : undefined,
      })

      if (!chat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Chat with id ${input.id} not found`,
        })
      }

      // Transform the result to include the last message if requested
      const transformedChat = {
        ...chat,
        lastMessage: input.includeLastMessage
          ? ((chat as any).messages as Message[])[0]
          : undefined,
      }

      return { chat: transformedChat }
    }),

  /**
   * Create a new chat.
   * Only accessible by authenticated users.
   * @param input - The chat data following the {@link CreateChatSchema}
   * @param input.initialMessages - Array of message branches, where each branch is an array of messages. Each branch represents a separate conversation thread.
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
      }).extend({
        initialMessages: z
          .array(
            z.array(
              CreateMessageSchema.pick({
                id: true,
                role: true,
                agentId: true,
                content: true,
              }),
            ),
          )
          .refine(
            (branches) => {
              // Check if all branches have valid message structures
              return branches.every((branch) => {
                if (branch.length === 0) return false

                // Check if all messages in a branch have id or none have id
                const hasIds = branch.every((msg) => msg.id)
                const noIds = branch.every((msg) => !msg.id)
                if (!(hasIds || noIds)) {
                  return false
                }

                // If messages have IDs, check their order within the branch
                if (hasIds) {
                  for (let i = 1; i < branch.length; i++) {
                    const currentId = branch[i]?.id
                    const prevId = branch[i - 1]?.id
                    if (!currentId || !prevId || currentId <= prevId) {
                      return false
                    }
                  }
                }

                return true
              })
            },
            {
              message:
                'All messages in each branch must either have IDs or none should have IDs, and IDs must be in ascending order within each branch',
            },
          )
          .optional(),
        includeLastMessage: z.boolean().default(false),
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

      return await ctx.db.transaction(async (tx) => {
        // Create chat first
        const [chat] = await tx
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

        let messages: Message[] = []
        // Create initial messages if any
        if (input.initialMessages && input.initialMessages.length > 0) {
          // Process each branch separately and collect all messages
          const allBranchMessages: z.infer<typeof CreateMessageSchema>[] = []
          for (const branch of input.initialMessages) {
            if (branch.length === 0) continue

            // First pass: generate IDs for all messages in this branch
            const messageIds = branch.map((msg) => msg.id ?? generateMessageId())

            // Second pass: build messages with IDs and parentIds for this branch
            const branchMessages = branch.map(
              (msg, msgIndex) =>
                ({
                  ...msg,
                  id: messageIds[msgIndex],
                  chatId: chat.id,
                  // Only set parentId for messages after the first one in the branch
                  parentId: msgIndex === 0 ? undefined : messageIds[msgIndex - 1],
                }) satisfies z.infer<typeof CreateMessageSchema>,
            )
            allBranchMessages.push(...branchMessages)
          }

          // Create messages
          messages = await tx.insert(Message).values(allBranchMessages).returning()

          if (messages.length !== input.initialMessages.flat().length) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create initial messages',
            })
          }
        }

        return {
          chat: {
            ...chat,
            lastMessage:
              input.includeLastMessage && messages.length > 0
                ? messages[messages.length - 1]
                : undefined,
          },
        }
      })
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
      const { id, metadata, ...update } = input
      const chat = await getChatById(ctx, id)

      const updatedMetadata = metadata
        ? {
            ...chat.metadata,
            ...metadata,
          }
        : undefined

      const [updatedChat] = await ctx.db
        .update(Chat)
        .set({
          ...update,
          ...(updatedMetadata && { metadata: updatedMetadata }),
          // Update timestamp only if no other fields are updated
          ...(Object.keys(update).length === 0 && !metadata && { updatedAt: new Date() }),
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

  /**
   * Delete multiple chats by their IDs.
   * Only accessible by authenticated users.
   * @param input - Object containing array of chat IDs to delete
   * @returns Array of deleted chats
   */
  batchDelete: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/chats/batch-delete',
        protect: true,
        tags: ['chats'],
        summary: 'Delete multiple chats by their IDs',
      },
    })
    .input(z.object({ ids: z.array(z.string().min(32)).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await getAppById(ctx, ctx.auth.appId)

      // Delete chats that belong to the user and app
      const deletedChats = await ctx.db
        .delete(Chat)
        .where(
          and(
            eq(Chat.appId, ctx.auth.appId),
            eq(Chat.userId, ctx.auth.userId),
            inArray(Chat.id, input.ids),
          ),
        )
        .returning()

      if (deletedChats.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No chats found to delete',
        })
      }

      return { chats: deletedChats }
    }),

  /**
   * Clone a chat with specific messages.
   * Only accessible by authenticated users.
   * @param input - Object containing the source chat ID and array of message IDs to clone
   * @returns The cloned chat with messages
   */
  clone: appUserProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/chats/{id}/clone',
        protect: true,
        tags: ['chats'],
        summary: 'Clone a chat with specific messages',
      },
    })
    .input(
      z.object({
        id: z.string().min(32),
        messages: z.array(z.string().min(32)).min(1).max(1000),
        includeLastMessage: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the source chat to verify access and get metadata
      const sourceChat = await getChatById(ctx, input.id)

      // Query messages in the specified order
      const messages = await ctx.db.query.Message.findMany({
        where: and(eq(Message.chatId, input.id), inArray(Message.id, input.messages)),
        orderBy: asc(Message.id),
      })

      if (messages.length !== input.messages.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Some messages not found in the source chat',
        })
      }

      // Check if first message has no parent
      if (messages[0]!.parentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'First message must have no parent',
        })
      }

      // Validate parent-child relationships for subsequent messages
      for (let i = 1; i < messages.length; i++) {
        const currentMessage = messages[i]!
        const expectedParentId = messages[i - 1]!.id

        if (currentMessage.parentId !== expectedParentId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Message order is invalid: message ${currentMessage.id} should have parent ${expectedParentId}`,
          })
        }
      }

      return await ctx.db.transaction(async (tx) => {
        // Create new chat with same metadata
        const [newChat] = await tx
          .insert(Chat)
          .values({
            appId: ctx.auth.appId,
            userId: ctx.auth.userId,
            debug: sourceChat.debug,
            metadata: sourceChat.metadata,
          })
          .returning()

        if (!newChat) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create cloned chat',
          })
        }

        // Create new message IDs mapping
        const messageIdMapping = new Map<string, string>()
        const clonedMessages = messages.map((msg) => {
          const newMessageId = generateMessageId()
          messageIdMapping.set(msg.id, newMessageId)

          return {
            id: newMessageId,
            parentId: msg.parentId ? messageIdMapping.get(msg.parentId) : undefined,
            chatId: newChat.id,
            role: msg.role,
            agentId: msg.agentId,
            content: msg.content,
          }
        })

        // Insert all messages in one SQL statement
        const insertedMessages = await tx.insert(Message).values(clonedMessages).returning()

        if (insertedMessages.length !== clonedMessages.length) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to clone all messages',
          })
        }

        return {
          chat: {
            ...newChat,
            lastMessage: input.includeLastMessage ? insertedMessages.at(-1) : undefined,
          },
        }
      })
    }),
}
