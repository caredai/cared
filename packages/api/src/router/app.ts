import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { desc, eq } from '@mindworld/db'
import {
  App,
  AppMetadata,
  AppsToCategories,
  CreateAppSchema,
  UpdateAppSchema,
} from '@mindworld/db/schema'

import { protectedProcedure } from '../trpc'

export const appRouter = {
  list: protectedProcedure
    .input(
      z.object({
        offset: z.number().optional().default(0),
        limit: z.number().optional().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.App.findMany({
        orderBy: desc(App.createdAt),
        offset: input.offset,
        limit: input.limit,
      })
    }),

  listByCategoryId: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        offset: z.number().optional().default(0),
        limit: z.number().optional().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.AppsToCategories.findMany({
        where: eq(AppsToCategories.categoryId, input.categoryId),
        with: {
          app: true,
        },
        orderBy: desc(App.createdAt),
        offset: input.offset,
        limit: input.limit,
      })
      return result.map((r) => r.app)
    }),

  byId: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.query.App.findFirst({
      where: eq(App.id, input),
    })
  }),

  create: protectedProcedure.input(CreateAppSchema).mutation(({ ctx, input }) => {
    return ctx.db.insert(App).values(input)
  }),

  update: protectedProcedure.input(UpdateAppSchema).mutation(async ({ ctx, input }) => {
    const { id, metadata: newMetadata, ...restUpdate } = input
    const update: Partial<{
      name: string
      metadata: AppMetadata
      visibility: 'public' | 'private'
    }> = { ...restUpdate }

    const app = await ctx.db.query.App.findFirst({
      where: eq(App.id, id),
    })

    if (!app) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `App with id ${id} not found`,
      })
    }

    if (newMetadata) {
      update.metadata = {
        ...app.metadata,
        ...newMetadata,
      }
    }

    await ctx.db.update(App).set(update).where(eq(App.id, id))
  }),
}
