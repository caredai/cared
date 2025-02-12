import type { SQL } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { and, asc, count, desc, eq, inArray, sql } from '@mindworld/db'
import {
  App,
  AppsToCategories,
  AppsToTags,
  AppVersion,
  Category,
  CreateAppSchema,
  CreateAppVersionSchema,
  DRAFT_VERSION,
  Membership,
  Tag,
  UpdateAppSchema,
} from '@mindworld/db/schema'

import type { Context } from '../trpc'
import { protectedProcedure, publicProcedure } from '../trpc'

/**
 * Verify if the user is a member of the workspace
 */
async function verifyWorkspaceMembership(ctx: Context, workspaceId: string) {
  const membership = await ctx.db.query.Membership.findFirst({
    where: and(eq(Membership.workspaceId, workspaceId), eq(Membership.userId, ctx.auth.userId!)),
  })

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this workspace',
    })
  }

  return membership
}

/**
 * Get an app by ID and verify workspace access.
 * @param ctx - The context object
 * @param id - The app ID
 * @param workspaceId - Optional workspace ID for access verification
 * @returns The app if found
 * @throws {TRPCError} If app not found
 */
export async function getAppById(ctx: Context, id: string, workspaceId?: string) {
  const query = workspaceId ? and(eq(App.id, id), eq(App.workspaceId, workspaceId)) : eq(App.id, id)

  const app = await ctx.db.query.App.findFirst({
    where: query,
  })

  if (!app) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `App with id ${id} not found`,
    })
  }

  return app
}

/**
 * Get draft version of an app.
 * @param ctx - The context object
 * @param appId - The app ID
 * @returns The draft version if found
 * @throws {TRPCError} If draft version not found
 */
export async function getDraftVersion(ctx: Context, appId: string) {
  const draft = await ctx.db.query.AppVersion.findFirst({
    where: and(eq(AppVersion.appId, appId), eq(AppVersion.version, DRAFT_VERSION)),
  })

  if (!draft) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Draft version not found',
    })
  }

  return draft
}

/**
 * Get apps with their categories and tags.
 * @param ctx - The context object
 * @param baseQuery - Query parameters including where clause, offset and limit
 * @returns Array of apps with their associated categories and tags
 */
export async function getApps(
  ctx: Context,
  baseQuery: { where?: SQL<unknown>; offset: number; limit: number },
) {
  // Get paginated apps first
  const apps = await ctx.db
    .select()
    .from(App)
    .where(baseQuery.where)
    .orderBy(desc(App.createdAt))
    .offset(baseQuery.offset)
    .limit(baseQuery.limit)

  if (apps.length === 0) {
    return []
  }

  // Get top 5 latest categories for each app
  const categories = await ctx.db
    .select({
      appId: AppsToCategories.appId,
      category: {
        id: Category.id,
        name: Category.name,
      },
    })
    .from(AppsToCategories)
    .innerJoin(Category, eq(Category.id, AppsToCategories.categoryId))
    .where(
      and(
        inArray(
          AppsToCategories.appId,
          apps.map((app) => app.id),
        ),
        sql`row_number
        () over (partition by
        ${AppsToCategories.appId}
        order
        by
        ${Category.createdAt}
        asc
        )
        <=
        5`,
      ),
    )

  // Get top 5 latest tags for each app
  const tags = await ctx.db
    .select({
      appId: AppsToTags.appId,
      tag: {
        name: Tag.name,
      },
    })
    .from(AppsToTags)
    .innerJoin(Tag, eq(Tag.name, AppsToTags.tag))
    .where(
      and(
        inArray(
          AppsToTags.appId,
          apps.map((app) => app.id),
        ),
        sql`row_number
        () over (partition by
        ${AppsToTags.appId}
        order
        by
        ${Tag.createdAt}
        asc
        )
        <=
        5`,
      ),
    )

  // Organize data into a map for efficient lookup
  const appsMap = new Map(
    apps.map((app) => [
      app.id,
      {
        app,
        categories: [] as string[],
        tags: [] as string[],
      },
    ]),
  )

  // Add categories to their respective apps
  categories.forEach(({ appId, category }) => {
    appsMap.get(appId)?.categories.push(category.name)
  })

  // Add tags to their respective apps
  tags.forEach(({ appId, tag }) => {
    appsMap.get(appId)?.tags.push(tag.name)
  })

  return Array.from(appsMap.values())
}

export const appRouter = {
  /**
   * List all apps in a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId and pagination parameters
   * @returns List of apps with their categories and tags
   * @throws {TRPCError} If workspace access verification fails
   */
  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(App)
        .where(eq(App.workspaceId, input.workspaceId))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get app count',
        })
      }

      const apps = await getApps(ctx, {
        where: eq(App.workspaceId, input.workspaceId),
        offset: input.offset,
        limit: input.limit,
      })

      return {
        apps,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * List all apps in a specific category within a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId, categoryId and pagination parameters
   * @returns List of apps in the category
   * @throws {TRPCError} If workspace access verification fails
   */
  listByCategory: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        categoryId: z.string(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(AppsToCategories)
        .innerJoin(App, eq(App.id, AppsToCategories.appId))
        .where(
          and(
            eq(App.workspaceId, input.workspaceId),
            eq(AppsToCategories.categoryId, input.categoryId),
          ),
        )

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get app count',
        })
      }

      const apps = await getApps(ctx, {
        where: and(
          eq(App.workspaceId, input.workspaceId),
          eq(AppsToCategories.categoryId, input.categoryId),
        ),
        offset: input.offset,
        limit: input.limit,
      })

      return {
        apps,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * List all apps with any of the specified tags in a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId, tags array and pagination parameters
   * @returns List of apps with matching tags
   * @throws {TRPCError} If workspace access verification fails
   */
  listByTags: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        tags: z.array(z.string()).min(1).max(10),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(App)
        .innerJoin(AppsToTags, eq(App.id, AppsToTags.appId))
        .where(and(eq(App.workspaceId, input.workspaceId), inArray(AppsToTags.tag, input.tags)))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get app count',
        })
      }

      const apps = await getApps(ctx, {
        where: and(eq(App.workspaceId, input.workspaceId), inArray(AppsToTags.tag, input.tags)),
        offset: input.offset,
        limit: input.limit,
      })

      return {
        apps,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * List all versions of an app.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId, app ID and pagination parameters
   * @returns List of app versions sorted by version number
   * @throws {TRPCError} If app not found or access verification fails
   */
  listVersions: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        id: z.string(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getAppById(ctx, input.id, input.workspaceId)

      const counts = await ctx.db
        .select({ count: count() })
        .from(AppVersion)
        .where(eq(AppVersion.appId, input.id))

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get version count',
        })
      }

      const versions = await ctx.db
        .select()
        .from(AppVersion)
        .where(eq(AppVersion.appId, input.id))
        .orderBy(desc(AppVersion.version))
        .offset(input.offset)
        .limit(input.limit)

      return {
        versions,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * Get a single app by ID within a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId and app ID
   * @returns The app if found
   * @throws {TRPCError} If app not found or access verification fails
   */
  byId: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      const app = await getAppById(ctx, input.id, input.workspaceId)
      return { app }
    }),

  /**
   * Create a new app in a workspace.
   * Only accessible by workspace members.
   * @param input - The app data following the {@link CreateAppSchema}
   * @returns The created app and its draft version
   * @throws {TRPCError} If app creation fails
   */
  create: protectedProcedure.input(CreateAppSchema).mutation(async ({ ctx, input }) => {
    await verifyWorkspaceMembership(ctx, input.workspaceId)

    return ctx.db.transaction(async (tx) => {
      const [app] = await tx.insert(App).values(input).returning()

      if (!app) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create app',
        })
      }

      const [draft] = await tx
        .insert(AppVersion)
        .values(
          CreateAppVersionSchema.parse({
            appId: app.id,
            version: DRAFT_VERSION,
            type: input.type ?? 'single-agent',
            name: input.name,
            metadata: input.metadata ?? {},
          }),
        )
        .returning()

      if (!draft) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create draft version',
        })
      }

      return {
        app,
        draft,
      }
    })
  }),

  /**
   * Update an existing app in a workspace.
   * Only updates the draft version.
   * Only accessible by workspace members.
   * @param input - The app data following the {@link UpdateAppSchema}
   * @returns The updated app and its draft version
   * @throws {TRPCError} If app update fails
   */
  update: protectedProcedure.input(UpdateAppSchema).mutation(async ({ ctx, input }) => {
    await verifyWorkspaceMembership(ctx, input.workspaceId)

    const { id, workspaceId, ...update } = input

    const app = await getAppById(ctx, id, workspaceId)
    const draft = await getDraftVersion(ctx, id)

    // Merge new metadata with existing metadata
    if (update.metadata) {
      update.metadata = {
        ...draft.metadata,
        ...update.metadata,
      }
    }

    // Update only the draft version
    const [updatedDraft] = await ctx.db
      .update(AppVersion)
      .set(update)
      .where(and(eq(AppVersion.appId, id), eq(AppVersion.version, DRAFT_VERSION)))
      .returning()

    if (!updatedDraft) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update draft version',
      })
    }

    return {
      app,
      draft: updatedDraft,
    }
  }),

  /**
   * Delete an app from a workspace.
   * Only accessible by workspace members.
   * Also deletes all related category and tag associations.
   * @param input - Object containing workspaceId and app ID
   * @returns Success status
   * @throws {TRPCError} If app deletion fails
   */
  delete: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getAppById(ctx, input.id, input.workspaceId)

      return await ctx.db.transaction(async (tx) => {
        // Delete all app versions
        await tx.delete(AppVersion).where(eq(AppVersion.appId, input.id))

        // Delete category associations
        await tx.delete(AppsToCategories).where(eq(AppsToCategories.appId, input.id))

        // Delete tag associations
        await tx.delete(AppsToTags).where(eq(AppsToTags.appId, input.id))

        // Delete the app itself
        await tx
          .delete(App)
          .where(and(eq(App.id, input.id), eq(App.workspaceId, input.workspaceId)))

        return { success: true }
      })
    }),

  /**
   * Publish an app version.
   * Creates a new published version while keeping the draft version.
   * Updates the app's main record to match the published version.
   * @param input - Object containing workspaceId and app ID
   * @returns The updated app and new version number
   * @throws {TRPCError} If publishing fails
   */
  publish: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getAppById(ctx, input.id, input.workspaceId)
      const draftVersion = await getDraftVersion(ctx, input.id)

      return ctx.db.transaction(async (tx) => {
        // Create new published version with current timestamp
        const publishedVersion = Math.floor(Date.now() / 1000)

        await tx.insert(AppVersion).values(
          CreateAppVersionSchema.parse({
            appId: input.id,
            version: publishedVersion,
            type: draftVersion.type,
            name: draftVersion.name,
            metadata: draftVersion.metadata,
          }),
        )

        // Update the app's main record to match the published version
        const [updatedApp] = await tx
          .update(App)
          .set({
            type: draftVersion.type,
            name: draftVersion.name,
            metadata: draftVersion.metadata,
          })
          .where(eq(App.id, input.id))
          .returning()

        return {
          app: updatedApp,
          version: publishedVersion,
        }
      })
    }),

  /**
   * Update tags for an app.
   * Replaces all existing tags with the new ones.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId, app ID and new tags array
   * @returns The updated tags
   * @throws {TRPCError} If tag update fails
   */
  updateTags: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        id: z.string(),
        tags: z.array(z.string()).max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getAppById(ctx, input.id, input.workspaceId)

      return ctx.db.transaction(async (tx) => {
        // Delete all existing tags
        await tx.delete(AppsToTags).where(eq(AppsToTags.appId, input.id))

        // Insert new tags if any
        if (input.tags.length > 0) {
          // Ensure all tags exist
          await tx
            .insert(Tag)
            .values(input.tags.map((name) => ({ name })))
            .onConflictDoNothing()

          // Associate tags with app
          await tx.insert(AppsToTags).values(input.tags.map((tag) => ({ appId: input.id, tag })))
        }

        const tags = await tx
          .select({
            tag: Tag,
          })
          .from(AppsToTags)
          .innerJoin(Tag, eq(Tag.name, AppsToTags.tag))
          .where(eq(AppsToTags.appId, input.id))
          .limit(5)

        return {
          tags: tags.map((r) => r.tag),
        }
      })
    }),

  /**
   * List all categories.
   * Accessible by any user.
   * @param input - Pagination parameters
   * @returns List of categories with total count
   * @throws {TRPCError} If category retrieval fails
   */
  listCategories: publicProcedure
    .input(
      z.object({
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const counts = await ctx.db.select({ count: count() }).from(Category)

      if (!counts[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get category count',
        })
      }

      const categories = await ctx.db.query.Category.findMany({
        orderBy: desc(Category.createdAt),
        offset: input.offset,
        limit: input.limit,
      })

      return {
        categories,
        total: counts[0].count,
        offset: input.offset,
        limit: input.limit,
      }
    }),

  /**
   * Update app categories.
   * Add and/or remove categories for an app.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId, app ID, categories to add and/or remove
   * @returns The updated categories
   * @throws {TRPCError} If category update fails
   */
  updateCategories: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        id: z.string(),
        add: z.array(z.string()).optional(),
        remove: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)
      await getAppById(ctx, input.id, input.workspaceId)

      return ctx.db.transaction(async (tx) => {
        // Remove categories if specified
        if (input.remove?.length) {
          await tx
            .delete(AppsToCategories)
            .where(
              and(
                eq(AppsToCategories.appId, input.id),
                inArray(AppsToCategories.categoryId, input.remove),
              ),
            )
        }

        // Add categories if specified
        if (input.add?.length) {
          await tx
            .insert(AppsToCategories)
            .values(
              input.add.map((categoryId) => ({
                appId: input.id,
                categoryId,
              })),
            )
            .onConflictDoNothing()
        }
      })
    }),
}
