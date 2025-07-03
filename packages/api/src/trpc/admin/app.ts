import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import type { SQL } from '@ownxai/db'
import { and, desc, eq, gt, inArray, lt } from '@ownxai/db'
import {
  AppsToCategories,
  AppsToTags,
  AppVersion,
  Category,
  CreateCategorySchema,
  Tag,
  UpdateCategorySchema,
} from '@ownxai/db/schema'

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
      z
        .object({
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
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
        first: result.first,
        last: result.last,
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
      z
        .object({
          categoryId: z.string(),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
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
        first: result.first,
        last: result.last,
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
      z
        .object({
          tags: z.array(z.string()).min(1).max(10),
          after: z.string().optional(),
          before: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
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
        first: result.first,
        last: result.last,
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
      z
        .object({
          id: z.string(),
          after: z.number().optional(),
          before: z.number().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .refine(
          ({ after, before }) => !(after && before),
          'Cannot use both after and before cursors',
        ),
    )
    .query(async ({ ctx, input }) => {
      await getAppById(ctx, input.id)

      const conditions: SQL<unknown>[] = [eq(AppVersion.appId, input.id)]

      // Add cursor conditions based on pagination direction
      if (typeof input.after === 'number') {
        conditions.push(gt(AppVersion.version, input.after))
      } else if (typeof input.before === 'number') {
        conditions.push(lt(AppVersion.version, input.before))
      }

      const query = and(...conditions)

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before

      // Fetch versions with appropriate ordering
      let versions
      if (isBackwardPagination) {
        versions = await ctx.db
          .select()
          .from(AppVersion)
          .where(query)
          .orderBy(AppVersion.version) // Ascending order
          .limit(input.limit + 1)
      } else {
        versions = await ctx.db
          .select()
          .from(AppVersion)
          .where(query)
          .orderBy(desc(AppVersion.version)) // Descending order
          .limit(input.limit + 1)
      }

      const hasMore = versions.length > input.limit
      if (hasMore) {
        versions.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      versions = isBackwardPagination ? versions.reverse() : versions

      // Get first and last version numbers
      const first = versions[0]?.version
      const last = versions[versions.length - 1]?.version

      return {
        versions,
        hasMore,
        first,
        last,
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

  /**
   * Update an existing category.
   * Only accessible by admin users.
   * @param input - The category data following the {@link UpdateCategorySchema}
   * @returns The updated category
   * @throws {TRPCError} If category not found
   */
  updateCategory: adminProcedure.input(UpdateCategorySchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input
    // Find category by ID to ensure it exists
    const [existing] = await ctx.db.select().from(Category).where(eq(Category.id, id)).limit(1)

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Category with ID ${id} not found`,
      })
    }

    // Update the category
    const updatedCategory = await ctx.db
      .update(Category)
      .set(updates)
      .where(eq(Category.id, id))
      .returning()

    return {
      category: updatedCategory[0],
    }
  }),

  /**
   * Delete a category by ID.
   * Only accessible by admin users.
   * @param input - Object containing the category ID
   * @throws {TRPCError} If category not found or delete fails
   */
  deleteCategory: adminProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find category by ID to ensure it exists
      const [existing] = await ctx.db
        .select()
        .from(Category)
        .where(eq(Category.id, input.id))
        .limit(1)

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Category with ID ${input.id} not found`,
        })
      }

      // Delete the category
      // Note: This will fail if there are apps associated with this category due to foreign key constraints
      return ctx.db.transaction(async (tx) => {
        // First delete any associations in AppsToCategories table
        await tx.delete(AppsToCategories).where(eq(AppsToCategories.categoryId, input.id))

        // Then delete the category itself
        await tx.delete(Category).where(eq(Category.id, input.id))
      })
    }),

  /**
   * Delete one or more tags and remove all associations with apps.
   * Only accessible by admin users.
   * @param input - Object containing array of tag names to delete
   * @returns The number of tags deleted
   */
  deleteTags: adminProcedure
    .input(
      z.object({
        tags: z.array(z.string()).min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify that all tags exist before attempting to delete
      const existingTags = await ctx.db.select().from(Tag).where(inArray(Tag.name, input.tags))

      if (existingTags.length !== input.tags.length) {
        const foundTagNames = existingTags.map((tag) => tag.name)
        const missingTags = input.tags.filter((tag) => !foundTagNames.includes(tag))

        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `The following tags were not found: ${missingTags.join(', ')}`,
        })
      }

      // Delete the tags and their associations in a transaction
      return ctx.db.transaction(async (tx) => {
        // First delete associations in AppsToTags table
        await tx.delete(AppsToTags).where(inArray(AppsToTags.tag, input.tags))

        // Then delete the tags themselves
        await tx.delete(Tag).where(inArray(Tag.name, input.tags))
      })
    }),
}
