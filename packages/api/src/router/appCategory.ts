import { z } from 'zod'

import { and, desc, eq } from '@mindworld/db'
import {
  AppsToCategories,
  Category,
  CreateAppsToCategoriesSchema,
  CreateCategorySchema,
} from '@mindworld/db/schema'

import { protectedProcedure, publicProcedure } from '../trpc'

export const appCategoryRouter = {
  list: publicProcedure
    .input(
      z.object({
        offset: z.number().optional().default(0),
        limit: z.number().optional().default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.Category.findMany({
        orderBy: desc(Category.createdAt),
        offset: input.offset,
        limit: input.limit,
      })
    }),

  create: protectedProcedure.input(CreateCategorySchema).mutation(({ ctx, input }) => {
    return ctx.db.insert(Category).values(input)
  }),

  listByAppId: publicProcedure.input(z.string()).query(async ({ ctx, input: appId }) => {
    const result = await ctx.db.query.AppsToCategories.findMany({
      where: eq(AppsToCategories.appId, appId),
      with: {
        category: true,
      },
      orderBy: desc(Category.createdAt),
    })
    return result.map((r) => r.category)
  }),

  addAppToCategory: protectedProcedure
    .input(CreateAppsToCategoriesSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(AppsToCategories).values(input)
    }),

  removeAppFromCategory: protectedProcedure
    .input(CreateAppsToCategoriesSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .delete(AppsToCategories)
        .where(
          and(
            eq(AppsToCategories.appId, input.appId),
            eq(AppsToCategories.categoryId, input.categoryId),
          ),
        )
    }),
}
