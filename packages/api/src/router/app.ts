import type { SQL } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { AppMetadata } from '@mindworld/db/schema'
import { and, count, desc, eq, gt, inArray, lt, sql } from '@mindworld/db'
import {
  Agent,
  AgentVersion,
  App,
  AppsToCategories,
  AppsToTags,
  AppVersion,
  Category,
  CreateAgentVersionSchema,
  CreateAppSchema,
  DRAFT_VERSION,
  Tag,
  UpdateAppSchema,
} from '@mindworld/db/schema'
import { defaultModels } from '@mindworld/providers'
import { mergeWithoutUndefined } from '@mindworld/shared'

import type { Context } from '../trpc'
import { cfg } from '../config'
import { publicProcedure, userProtectedProcedure } from '../trpc'
import { verifyWorkspaceMembership } from './workspace'

/**
 * Get an app by ID.
 * @param ctx - The context object
 * @param id - The app ID
 * @returns The app if found
 * @throws {TRPCError} If app not found
 */
export async function getAppById(ctx: Context, id: string) {
  const app = await ctx.db.query.App.findFirst({
    where: eq(App.id, id),
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
 * Get apps with their categories and tags.
 * @param ctx - The context object
 * @param baseQuery - Query parameters including where clause and limit
 * @returns Array of apps with their associated categories and tags, hasMore flag, and first/last IDs
 */
export async function getApps(
  ctx: Context,
  baseQuery: {
    where?: SQL<unknown>
    limit: number
    after?: string
    before?: string
  },
) {
  const conditions: SQL<unknown>[] = []

  if (baseQuery.where) {
    conditions.push(baseQuery.where)
  }

  // Add cursor conditions based on pagination direction
  if (baseQuery.after) {
    conditions.push(gt(App.id, baseQuery.after))
  } else if (baseQuery.before) {
    conditions.push(lt(App.id, baseQuery.before))
  }

  const query = conditions.length > 0 ? and(...conditions) : undefined

  // Determine if this is backward pagination
  const isBackwardPagination = !!baseQuery.before

  // Get paginated apps with appropriate ordering
  let apps
  if (isBackwardPagination) {
    apps = await ctx.db
      .select()
      .from(App)
      .where(query)
      .orderBy(App.id) // Ascending order
      .limit(baseQuery.limit + 1) // Get one extra to determine hasMore
  } else {
    apps = await ctx.db
      .select()
      .from(App)
      .where(query)
      .orderBy(desc(App.id)) // Descending order
      .limit(baseQuery.limit + 1) // Get one extra to determine hasMore
  }

  const hasMore = apps.length > baseQuery.limit
  if (hasMore) {
    apps.pop() // Remove the extra item
  }

  // Reverse results for backward pagination to maintain consistent ordering
  apps = isBackwardPagination ? apps.reverse() : apps

  if (apps.length === 0) {
    return {
      apps: [],
      hasMore: false,
      first: undefined,
      last: undefined,
    }
  }

  // Get first and last IDs
  const first = apps[0]?.id
  const last = apps[apps.length - 1]?.id

  // Get categories for each app
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
      inArray(
        AppsToCategories.appId,
        apps.map((app) => app.id),
      ),
    )

  // Get tags for each app
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
      inArray(
        AppsToTags.appId,
        apps.map((app) => app.id),
      ),
    )

  // Organize data into a map for efficient lookup
  const appsMap = new Map(
    apps.map((app) => [
      app.id,
      {
        app,
        categories: [] as Omit<Category, 'createdAt' | 'updatedAt'>[],
        tags: [] as string[],
      },
    ]),
  )

  // Add categories to their respective apps
  categories.forEach(({ appId, category }) => {
    appsMap.get(appId)?.categories.push(category)
  })

  // Add tags to their respective apps
  tags.forEach(({ appId, tag }) => {
    appsMap.get(appId)?.tags.push(tag.name)
  })

  return {
    apps: Array.from(appsMap.values()),
    hasMore,
    first,
    last,
  }
}

/**
 * Get an app version by app ID and version.
 * @param ctx - The context object
 * @param appId - The app ID
 * @param version - The version number or 'latest' or 'draft'
 * @returns The app version if found
 * @throws {TRPCError} If app version not found
 */
export async function getAppVersion(
  ctx: Context,
  appId: string,
  version?: number | 'latest' | 'draft',
) {
  let appVersion

  if (!version) {
    version = 'latest'
  }

  if (version === 'draft') {
    appVersion = await ctx.db.query.AppVersion.findFirst({
      where: and(eq(AppVersion.appId, appId), eq(AppVersion.version, DRAFT_VERSION)),
    })
  } else if (version === 'latest') {
    appVersion = await ctx.db.query.AppVersion.findFirst({
      where: and(
        eq(AppVersion.appId, appId),
        lt(AppVersion.version, DRAFT_VERSION), // Exclude draft version
      ),
      orderBy: desc(AppVersion.version),
    })
  } else {
    appVersion = await ctx.db.query.AppVersion.findFirst({
      where: and(eq(AppVersion.appId, appId), eq(AppVersion.version, version)),
    })
  }

  if (!appVersion) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `App version '${version}' not found for app ${appId}`,
    })
  }

  return appVersion
}

export const appRouter = {
  /**
   * List all apps in a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId and pagination parameters
   * @returns List of apps with their categories and tags
   * @throws {TRPCError} If workspace access verification fails
   */
  list: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/apps' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const result = await getApps(ctx, {
        where: eq(App.workspaceId, input.workspaceId),
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
   * List all apps in a specific category within a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId, categoryId and pagination parameters
   * @returns List of apps in the category
   * @throws {TRPCError} If workspace access verification fails
   */
  listByCategory: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/apps/by-category/{categoryId}' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        categoryId: z.string(),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const result = await getApps(ctx, {
        where: and(
          eq(App.workspaceId, input.workspaceId),
          eq(AppsToCategories.categoryId, input.categoryId),
        ),
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
   * List all apps with any of the specified tags in a workspace.
   * Only accessible by workspace members.
   * @param input - Object containing workspaceId, tags array and pagination parameters
   * @returns List of apps with matching tags
   * @throws {TRPCError} If workspace access verification fails
   */
  listByTags: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/apps/by-tags' } })
    .input(
      z.object({
        workspaceId: z.string().min(32),
        tags: z.array(z.string()).min(1).max(20),
        after: z.string().optional(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const result = await getApps(ctx, {
        where: and(eq(App.workspaceId, input.workspaceId), inArray(AppsToTags.tag, input.tags)),
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
   * List all versions of an app.
   * Only accessible by workspace members.
   * @param input - Object containing app ID and pagination parameters
   * @returns List of app versions sorted by version number
   * @throws {TRPCError} If app not found or access verification fails
   */
  listVersions: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/apps/{id}/versions' } })
    .input(
      z.object({
        id: z.string(),
        after: z.number().optional(),
        before: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)

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
   * Get a single app by ID.
   * Only accessible by workspace members.
   * @param input - The app ID
   * @returns The app if found
   * @throws {TRPCError} If app not found or access verification fails
   */
  byId: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/apps/{id}' } })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)
      return { app }
    }),

  /**
   * Get a specific version of an app.
   * Only accessible by workspace members.
   * @param input - Object containing app ID and version number
   * @returns The app version if found
   * @throws {TRPCError} If app version not found or access verification fails
   */
  getVersion: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/apps/{id}/versions/{version}' } })
    .input(
      z.object({
        id: z.string(),
        version: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)

      const version = await ctx.db.query.AppVersion.findFirst({
        where: and(eq(AppVersion.appId, input.id), eq(AppVersion.version, input.version)),
      })

      if (!version) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Version ${input.version} of app ${input.id} not found`,
        })
      }

      return { version }
    }),

  /**
   * Create a new app in a workspace.
   * Only accessible by workspace members.
   * @param input - The app data following the {@link CreateAppSchema}
   * @returns The created app and its draft version
   * @throws {TRPCError} If app creation fails
   */
  create: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/apps' } })
    .input(CreateAppSchema)
    .mutation(async ({ ctx, input }) => {
      await verifyWorkspaceMembership(ctx, input.workspaceId)

      const appValues = {
        ...input,
        metadata: mergeWithoutUndefined<AppMetadata>(defaultModels.app, input.metadata),
      }

      return ctx.db.transaction(async (tx) => {
        // Check if workspace has reached the maximum app limit
        const appsCount = await tx
          .select({ count: count() })
          .from(App)
          .where(eq(App.workspaceId, input.workspaceId))
          .then((r) => r[0]!.count)

        if (appsCount >= cfg.perWorkspace.maxApps) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Workspace has reached the maximum limit of ${cfg.perWorkspace.maxApps} applications`,
          })
        }

        const [app] = await tx.insert(App).values(appValues).returning()

        if (!app) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create app',
          })
        }

        const appVersionValues = {
          appId: app.id,
          version: DRAFT_VERSION,
          type: app.type,
          name: app.name,
          metadata: app.metadata,
        }

        const [draft] = await tx.insert(AppVersion).values(appVersionValues).returning()

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
   * Update an existing app.
   * Only updates the draft version.
   * Only accessible by workspace members.
   * @param input - The app data following the {@link UpdateAppSchema}
   * @returns The updated app and its draft version
   * @throws {TRPCError} If app update fails
   */
  update: userProtectedProcedure
    .meta({ openapi: { method: 'PATCH', path: '/v1/apps/{id}' } })
    .input(UpdateAppSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...update } = input
      const app = await getAppById(ctx, id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)

      const draft = await getAppVersion(ctx, id, 'draft')
      // Check if there's any published version
      const publishedVersion = await getAppVersion(ctx, id, 'latest').catch(() => undefined)

      const updateValues = {
        ...update,
        // Merge new metadata with existing metadata
        metadata: mergeWithoutUndefined<AppMetadata>(draft.metadata, update.metadata),
      }

      return ctx.db.transaction(async (tx) => {
        // Update draft version
        const [updatedDraft] = await tx
          .update(AppVersion)
          .set(updateValues)
          .where(and(eq(AppVersion.appId, id), eq(AppVersion.version, DRAFT_VERSION)))
          .returning()

        if (!updatedDraft) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update draft version',
          })
        }

        // If no published version exists, update the app's main record as well
        let updatedApp = app
        if (!publishedVersion) {
          const [newApp] = await tx.update(App).set(updateValues).where(eq(App.id, id)).returning()

          if (!newApp) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to update app',
            })
          }
          updatedApp = newApp
        }

        return {
          app: updatedApp,
          draft: updatedDraft,
        }
      })
    }),

  /**
   * Delete an app.
   * Only accessible by workspace members.
   * Also deletes all related category and tag associations.
   * Also deletes all related agents and their versions.
   * @param input - The app ID
   * @returns Success status
   * @throws {TRPCError} If app deletion fails
   */
  delete: userProtectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/v1/apps/{id}' } })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)

      return await ctx.db.transaction(async (tx) => {
        // Get all agent IDs for this app
        const agents = await tx
          .select({ id: Agent.id })
          .from(Agent)
          .where(eq(Agent.appId, input.id))

        if (agents.length > 0) {
          const agentIds = agents.map((agent) => agent.id)

          // Delete all agent versions in one query
          await tx.delete(AgentVersion).where(inArray(AgentVersion.agentId, agentIds))

          // Delete all agents in one query
          await tx.delete(Agent).where(inArray(Agent.id, agentIds))
        }

        // Delete all app versions
        await tx.delete(AppVersion).where(eq(AppVersion.appId, input.id))

        // Delete category associations
        await tx.delete(AppsToCategories).where(eq(AppsToCategories.appId, input.id))

        // Delete tag associations
        await tx.delete(AppsToTags).where(eq(AppsToTags.appId, input.id))

        // Delete the app itself
        await tx.delete(App).where(eq(App.id, input.id))

        return { success: true }
      })
    }),

  /**
   * Publish an app version.
   * Creates a new published version while keeping the draft version.
   * Updates the app's main record to match the published version.
   * Also publishes all associated agents.
   * @param input - The app ID
   * @returns The updated app and new version number
   * @throws {TRPCError} If publishing fails
   */
  publish: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/apps/{id}/publish' } })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)
      const draftVersion = await getAppVersion(ctx, input.id, 'draft')

      return ctx.db.transaction(async (tx) => {
        // Create new published version with current timestamp
        const publishedVersion = Math.floor(Date.now() / 1000)

        await tx.insert(AppVersion).values({
          appId: input.id,
          version: publishedVersion,
          type: draftVersion.type,
          name: draftVersion.name,
          metadata: draftVersion.metadata,
        })

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

        // Get all agents and their draft versions for this app in one query
        const agentsWithDrafts = await tx
          .select({
            agent: Agent,
            draft: AgentVersion,
          })
          .from(Agent)
          .innerJoin(
            AgentVersion,
            and(eq(AgentVersion.agentId, Agent.id), eq(AgentVersion.version, DRAFT_VERSION)),
          )
          .where(eq(Agent.appId, input.id))

        // Get total number of agents for this app
        const agentsCount = await tx
          .select({ count: count() })
          .from(Agent)
          .where(eq(Agent.appId, input.id))

        // Check if any agent is missing a draft version
        if (agentsWithDrafts.length !== agentsCount[0]!.count) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Some agents are missing draft versions',
          })
        }

        if (agentsWithDrafts.length > 0) {
          // Bulk insert new published versions
          await tx.insert(AgentVersion).values(
            agentsWithDrafts.map((item) =>
              CreateAgentVersionSchema.parse({
                agentId: item.agent.id,
                version: publishedVersion,
                name: item.draft.name,
                metadata: item.draft.metadata,
              }),
            ),
          )

          // Build CASE expressions for name and metadata updates
          const nameCaseChunks: SQL[] = []
          const metadataCaseChunks: SQL[] = []
          const agentIds: string[] = []

          nameCaseChunks.push(sql`(case`)
          metadataCaseChunks.push(sql`(case`)

          for (const item of agentsWithDrafts) {
            nameCaseChunks.push(sql`when ${Agent.id} = ${item.agent.id} then ${item.draft.name}`)
            metadataCaseChunks.push(
              sql`when ${Agent.id} = ${item.agent.id} then ${item.draft.metadata}`,
            )
            agentIds.push(item.agent.id)
          }

          nameCaseChunks.push(sql`end)`)
          metadataCaseChunks.push(sql`end)`)

          const nameCase = sql.join(nameCaseChunks, sql.raw(' '))
          const metadataCase = sql.join(metadataCaseChunks, sql.raw(' '))

          // Update all agents in a single query
          await tx
            .update(Agent)
            .set({
              name: nameCase,
              metadata: metadataCase,
            })
            .where(inArray(Agent.id, agentIds))
        }

        return {
          app: updatedApp,
          version: publishedVersion,
        }
      })
    }),

  /**
   * List all tags.
   * Accessible by any user.
   * @param input - Pagination parameters
   * @returns List of tags
   * @throws {TRPCError} If tag retrieval fails
   */
  listTags: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/tags' } })
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
        )
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = []

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Tag.name, input.after))
      } else if (input.before) {
        conditions.push(lt(Tag.name, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before
      // Fetch tags with appropriate ordering
      let tags
      if (isBackwardPagination) {
        tags = await ctx.db.query.Tag.findMany({
          where: query,
          orderBy: Tag.name, // Ascending order
          limit: input.limit + 1,
        })
      } else {
        tags = await ctx.db.query.Tag.findMany({
          where: query,
          orderBy: desc(Tag.name), // Descending order
          limit: input.limit + 1,
        })
      }

      const hasMore = tags.length > input.limit
      if (hasMore) {
        tags.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      // For example: if forward pagination shows A->B->C, backward pagination should also return results in A->B->C order
      tags = isBackwardPagination ? tags.reverse() : tags

      // Get first and last tag names from the result
      const first = tags[0]?.name
      const last = tags[tags.length - 1]?.name

      return {
        tags,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Update tags for an app.
   * Replaces all existing tags with the new ones.
   * Only accessible by workspace members.
   * @param input - Object containing app ID and new tags array
   * @returns The updated tags
   * @throws {TRPCError} If tag update fails
   */
  updateTags: userProtectedProcedure
    .meta({ openapi: { method: 'PATCH', path: '/v1/apps/{id}/tags' } })
    .input(
      z.object({
        id: z.string(),
        tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)

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
   * @returns List of categories
   * @throws {TRPCError} If category retrieval fails
   */
  listCategories: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/categories' } })
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
        )
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = []

      // Add cursor conditions based on pagination direction
      if (input.after) {
        conditions.push(gt(Category.id, input.after))
      } else if (input.before) {
        conditions.push(lt(Category.id, input.before))
      }

      const query = conditions.length > 0 ? and(...conditions) : undefined

      // Determine if this is backward pagination
      const isBackwardPagination = !!input.before
      // Fetch categories with appropriate ordering
      let categories
      if (isBackwardPagination) {
        categories = await ctx.db.query.Category.findMany({
          where: query,
          orderBy: Category.id, // Ascending order
          limit: input.limit + 1,
        })
      } else {
        categories = await ctx.db.query.Category.findMany({
          where: query,
          orderBy: desc(Category.id), // Descending order
          limit: input.limit + 1,
        })
      }

      const hasMore = categories.length > input.limit
      if (hasMore) {
        categories.pop()
      }

      // Reverse results for backward pagination to maintain consistent ordering
      categories = isBackwardPagination ? categories.reverse() : categories

      // Get first and last category IDs
      const first = categories[0]?.id
      const last = categories[categories.length - 1]?.id

      return {
        categories,
        hasMore,
        first,
        last,
      }
    }),

  /**
   * Update app categories.
   * Add and/or remove categories for an app.
   * Only accessible by workspace members.
   * @param input - Object containing app ID, categories to add and/or remove
   * @returns The updated categories
   * @throws {TRPCError} If category update fails
   */
  updateCategories: userProtectedProcedure
    .meta({ openapi: { method: 'PATCH', path: '/v1/apps/{id}/categories' } })
    .input(
      z.object({
        id: z.string(),
        add: z.array(z.string()).optional(),
        remove: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.id)
      await verifyWorkspaceMembership(ctx, app.workspaceId)

      // Check for same category IDs in both add and remove arrays
      if (input.add?.length && input.remove?.length) {
        const intersection = input.add.filter((id) => input.remove?.includes(id))
        if (intersection.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot add and remove the same categories: ${intersection.join(', ')}`,
          })
        }
      }

      return ctx.db.transaction(async (tx) => {
        // Get current categories count
        const currentCategories = await tx
          .select({ categoryId: AppsToCategories.categoryId })
          .from(AppsToCategories)
          .where(eq(AppsToCategories.appId, input.id))

        // Get existing category IDs
        const existingCategoryIds = currentCategories.map((c) => c.categoryId)

        // Ensure categories to remove exist
        if (input.remove?.length) {
          const nonExistingCategories = input.remove.filter(
            (id) => !existingCategoryIds.includes(id),
          )
          if (nonExistingCategories.length > 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `The following categories do not exist: ${nonExistingCategories.join(', ')}`,
            })
          }
        }

        // Ensure categories to add don't already exist
        if (input.add?.length) {
          const alreadyExistingCategories = input.add.filter((id) =>
            existingCategoryIds.includes(id),
          )
          if (alreadyExistingCategories.length > 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `The following categories already exist: ${alreadyExistingCategories.join(', ')}`,
            })
          }
        }

        // Calculate potential new count
        const removeCategoryIds = input.remove ?? []
        const addCategoryIds = input.add ?? []

        // Calculate new count after removing and adding
        const newCategoryCount =
          currentCategories.length - removeCategoryIds.length + addCategoryIds.length

        // Check if new count exceeds the maximum limit
        if (newCategoryCount > 20) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Maximum 20 categories allowed per app',
          })
        }

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

        // Return updated categories
        const updatedCategories = await tx
          .select({
            category: {
              id: Category.id,
              name: Category.name,
            },
          })
          .from(AppsToCategories)
          .innerJoin(Category, eq(Category.id, AppsToCategories.categoryId))
          .where(eq(AppsToCategories.appId, input.id))

        return {
          categories: updatedCategories.map((r) => r.category),
        }
      })
    }),
}
