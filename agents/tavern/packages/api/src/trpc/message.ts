import type { Message } from '@tavern/core'
import { messageContentSchema } from '@tavern/core'
import { z } from 'zod'

import { createOwnxClient } from '../ownx'
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
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { messages, hasMore, last } = await ownxTrpc.message.list.query({
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
        role: z.enum(['user', 'assistant']),
        content: messageContentSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { id, parentId, chatId, role, content } = input
      const { message } = await ownxTrpc.message.create.mutate({
        id,
        parentId,
        chatId,
        role,
        content,
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
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { message } = await ownxTrpc.message.update.mutate({
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
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { messages } = await ownxTrpc.message.delete.mutate(input)

      return { messages: messages as Message[] }
    }),
}
