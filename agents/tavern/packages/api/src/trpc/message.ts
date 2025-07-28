import type { Message } from '@tavern/core'
import { messageContentSchema } from '@tavern/core'
import { z } from 'zod/v4'

import { createCaredClient } from '../cared'
import { userProtectedProcedure } from '../trpc'

export const messageRouter = {
  list: userProtectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(1000).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cared = createCaredClient(ctx)
      const caredTrpc = cared.trpc

      const { messages, hasMore, last } = await caredTrpc.message.list.query({
        chatId: input.chatId,
        before: input.cursor,
        limit: input.limit,
        order: 'desc',
      })

      return {
        messages: messages as Message[],
        hasMore,
        cursor: last,
      }
    }),

  create: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        parentId: z.string().optional(),
        chatId: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: messageContentSchema,
        isRoot: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cared = createCaredClient(ctx)
      const caredTrpc = cared.trpc

      const { id, parentId, chatId, role, content, isRoot } = input
      const { message } = await caredTrpc.message.create.mutate({
        id,
        parentId,
        chatId,
        role,
        content,
        isRoot,
      })

      return {
        message: message as Message,
      }
    }),

  update: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: messageContentSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cared = createCaredClient(ctx)
      const caredTrpc = cared.trpc

      const { message } = await caredTrpc.message.update.mutate({
        id: input.id,
        ...(input.content && { content: input.content }),
      })

      return {
        message: message as Message,
      }
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        deleteTrailing: z.boolean().optional(),
        excludeSelf: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cared = createCaredClient(ctx)
      const caredTrpc = cared.trpc

      const { messages } = await caredTrpc.message.delete.mutate(input)

      return { messages: messages as Message[] }
    }),
}
