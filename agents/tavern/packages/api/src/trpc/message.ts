import { z } from 'zod'

import { createOwnxClient } from '../ownx'
import { userProtectedProcedure } from '../trpc'

export const messageRouter = {
  list: userProtectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(10000).default(50),
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
        messages,
        hasMore,
        cursor: last,
      }
    }),

  batchCreate: userProtectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.object({
              parts: z.array(
                z.object({
                  type: z.literal('text'),
                  text: z.string(),
                }),
              ),
            }),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { messages } = await ownxTrpc.message.batchCreate.mutate({
        chatId: input.chatId,
        messages: input.messages,
      })

      return {
        messages,
      }
    }),

  update: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.object({
          parts: z.array(
            z.object({
              type: z.literal('text'),
              text: z.string(),
            }),
          ),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { message } = await ownxTrpc.message.update.mutate({
        id: input.id,
        content: input.content,
      })

      return {
        message,
      }
    }),
}
