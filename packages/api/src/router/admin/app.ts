import { z } from 'zod'

import { and, desc, eq, gt, inArray, lt, SQL } from '@mindworld/db'
import {
  AppsToCategories,
  AppsToTags,
  AppVersion,
  Category,
  CreateCategorySchema,
} from '@mindworld/db/schema'

import { adminProcedure } from '../../trpc'
import { getAppById, getApps } from '../app'

export const appRouter = {
  /**
   * List all apps across all workspaces.
   * Only accessible by admin users.
   * @param input - Pagination parameters
   * @returns List of apps with hasMore flag
   */
  list: adminProcedure
    .input(
      z.object({
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await getApps(ctx, {
        after: input.after,
        before: input.before,
        limit: input.limit,
      })

      return {
        apps: result.apps,
        hasMore: result.hasMore,
        limit: input.limit,
      }
    }),

  /**
   * List all apps in a specific category across all workspaces.
   * Only accessible by admin users.
   * @param input - Object containing categoryId and pagination parameters
   * @returns List of apps in the category
   */
  listByCategory: adminProcedure
    .input(
      z.object({
        categoryId: z.string(),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await getApps(ctx, {
        where: eq(AppsToCategories.categoryId, input.categoryId),
        after: input.after,
        before: input.before,
        limit: input.limit,
      })

      return {
        apps: result.apps,
        hasMore: result.hasMore,
        limit: input.limit,
      }
    }),

  /**
   * List all apps with any of the specified tags across all workspaces.
   * Only accessible by admin users.
   * @param input - Object containing tags array and pagination parameters
   * @returns List of apps with matching tags
   */
  listByTags: adminProcedure
    .input(
      z.object({
        tags: z.array(z.string()).min(1).max(10),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await getApps(ctx, {
        where: inArray(AppsToTags.tag, input.tags),
        after: input.after,
        before: input.before,
        limit: input.limit,
      })

      return {
        apps: result.apps,
        hasMore: result.hasMore,
        limit: input.limit,
      }
    }),

  /**
   * List all versions of an app across all workspaces.
   * Only accessible by admin users.
   * @param input - Object containing app ID and pagination parameters
   * @returns List of app versions sorted by version number
   * @throws {TRPCError} If app not found
   */
  listVersions: adminProcedure
    .input(
      z.object({
        id: z.string(),
        after: z.number().optional(),
        before: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAppById(ctx, input.id)

      const conditions: SQL<unknown>[] = [eq(AppVersion.appId, input.id)]

      if (typeof input.after === 'number') {
        conditions.push(gt(AppVersion.version, input.after))
      }
      if (typeof input.before === 'number') {
        conditions.push(lt(AppVersion.version, input.before))
      }

      const versions = await ctx.db
        .select()
        .from(AppVersion)
        .where(and(...conditions))
        .orderBy(desc(AppVersion.version))
        .limit(input.limit + 1)

      const hasMore = versions.length > input.limit
      if (hasMore) {
        versions.pop()
      }

      return {
        versions,
        hasMore,
        limit: input.limit,
      }
    }),

  /**
   * Get a single app by ID across all workspaces.
   * Only accessible by admin users.
   * @param input - Object containing the app ID
   * @returns The app if found
   * @throws {TRPCError} If app not found
   */
  byId: adminProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      return { app }
    }),

  /**
   * Create a new category for apps.
   * Only accessible by admin users.
   * @param input - The category data following the {@link CreateCategorySchema}
   * @returns The newly created category
   */
  createCategory: adminProcedure.input(CreateCategorySchema).mutation(async ({ ctx, input }) => {
    const category = await ctx.db.insert(Category).values(input).returning()
    return {
      category,
    }
  }),
}
