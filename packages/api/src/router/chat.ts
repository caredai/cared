import { z } from 'zod'

import { and, desc, eq, gte } from '@mindworld/db'
import { Chat, CreateChatSchema, message, UpdateChatSchema } from '@mindworld/db/schema'

import { protectedProcedure } from '../trpc'

export const chatRouter = {
  byUserId: protectedProcedure
    .input(
      z.object({
        offset: z.number().optional().default(0),
        limit: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId
      return ctx.db.query.Chat.findMany({
        where: eq(Chat.userId, userId),
        orderBy: desc(Chat.updatedAt),
        offset: input.offset,
        limit: input.limit,
      })
    }),
  create: protectedProcedure.input(CreateChatSchema).mutation(({ ctx, input }) => {
    return ctx.db.insert(Chat).values(input)
  }),
  update: protectedProcedure.input(UpdateChatSchema).mutation(async ({ ctx, input }) => {
    const { id, ...update } = input
    await ctx.db.update(Chat).set(update).where(eq(Chat.id, id))
  }),
}

export const messageRouter = {
  byId: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.query.message.findFirst({
      where: eq(message.id, input),
    })
  }),
  deleteTrailing: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const msg = await ctx.db.query.message.findFirst({
      where: eq(message.id, input),
    })
    if (!msg) {
      return
    }
    await ctx.db
      .delete(message)
      .where(and(eq(message.chatId, msg.chatId), gte(message.createdAt, msg.createdAt)))
  }),
}
