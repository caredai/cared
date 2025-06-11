import { z } from 'zod'

import { createOwnxClient } from '../ownx'
import { userProtectedProcedure } from '../trpc'

export interface MessageMetadata {
  characterOrGroupId?: string
  modelId?: string
}

export const messageMetadataSchema = z.object({
  characterOrGroupId: z.string().optional(),
  modelId: z.string().optional(),
})

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
        }).optional(),
        metadata: messageMetadataSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { message } = await ownxTrpc.message.update.mutate({
        id: input.id,
        ...(input.content && {content: input.content}),
        ...(input.metadata && {metadata: input.metadata}),
      })

      return {
        message,
      }
    }),

  delete: userProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        deleteTrailing: z.boolean().optional(),
        excludeSelf: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      const { messages } = await ownxTrpc.message.delete.mutate(input)

      return { messages }
    }),
}
