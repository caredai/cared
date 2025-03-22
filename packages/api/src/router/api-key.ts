import { headers } from 'next/headers'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { auth } from '@mindworld/auth'
import { App } from '@mindworld/db/schema'

import { userProtectedProcedure } from '../trpc'
import { getAppById } from './app'
import { verifyWorkspaceOwner } from './workspace'

export const apiKeyRouter = {
  /**
   * List API keys for all apps for all workspaces or for a specific workspace.
   * Only accessible by workspace owner if workspace ID is provided.
   * @param input - Object containing optional workspace ID
   * @returns List of API keys
   * @throws {TRPCError} If user is not workspace owner when workspace ID is provided
   */
  list: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/api-keys',
        protect: true,
        tags: ['keys'],
        summary: 'List all API keys for a workspace',
      },
    })
    .input(
      z.object({
        workspaceId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let appIds: string[] = []
      if (input.workspaceId) {
        await verifyWorkspaceOwner(ctx, input.workspaceId)
        const apps = await ctx.db.query.App.findMany({
          where: eq(App.workspaceId, input.workspaceId),
        })
        appIds = apps.map((app) => app.id)
      }

      const allApiKeys = await auth.api.listApiKeys({
        headers: await headers(),
      })
      const apiKeys = input.workspaceId
        ? allApiKeys.filter((key) => appIds.includes(key.metadata?.appId))
        : allApiKeys

      return {
        keys: apiKeys.map((key) => ({
          appId: key.metadata?.appId,
          start: key.start,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt,
        })),
      }
    }),

  /**
   * Get API key for an app.
   * Only accessible by workspace owner.
   * @param input - Object containing app ID
   * @returns The API key if found
   * @throws {TRPCError} If user is not workspace owner or app not found
   */
  get: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/api-keys/{appId}',
        protect: true,
        tags: ['keys'],
        summary: 'Get API key for an app',
      },
    })
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { appId } = input
      const app = await getAppById(ctx, appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const allApiKeys = await auth.api.listApiKeys({
        headers: await headers(),
      })
      const apiKey = allApiKeys.find((key) => key.metadata?.appId === appId)
      if (!apiKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        })
      }

      const { start, createdAt, updatedAt } = apiKey
      return {
        key: {
          appId,
          start,
          createdAt,
          updatedAt,
        },
      }
    }),

  /**
   * Create a new API key for an app.
   * Only accessible by workspace owner.
   * @param input - Object containing app ID
   * @returns The created API key
   * @throws {TRPCError} If user is not workspace owner or app not found
   */
  create: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/api-keys',
        protect: true,
        tags: ['keys'],
        summary: 'Create a new API key for an app',
      },
    })
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId } = input
      const app = await getAppById(ctx, appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Check if app already has a key
      const allApiKeys = await auth.api.listApiKeys({
        headers: await headers(),
      })
      if (allApiKeys.filter((key) => key.metadata?.appId === appId).length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'App already has an API key',
        })
      }

      const apiKey = await auth.api.createApiKey({
        body: {
          metadata: {
            appId,
          },
          userId: ctx.auth.userId, // the user id to create the API key for
        },
      })

      const { key, start, createdAt, updatedAt } = apiKey
      return {
        key: {
          appId,
          key,
          start,
          createdAt,
          updatedAt,
        },
      }
    }),

  /**
   * Rotate (regenerate) the API key for an app.
   * Only accessible by workspace owner.
   * @param input - Object containing app ID
   * @returns The new API key
   * @throws {TRPCError} If user is not workspace owner or app not found
   */
  rotate: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/api-keys/{appId}/rotate',
        protect: true,
        tags: ['keys'],
        summary: 'Rotate (regenerate) API key for an app',
      },
    })
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId } = input
      const app = await getAppById(ctx, appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Check if app has an existing key
      const allApiKeys = await auth.api.listApiKeys({
        headers: await headers(),
      })
      const existingKey = allApiKeys.find((key) => key.metadata?.appId === appId)
      if (!existingKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        })
      }

      // Delete existing key
      await auth.api.deleteApiKey({
        body: {
          keyId: existingKey.id,
        },
        headers: await headers(),
      })

      // Create new API key
      const apiKey = await auth.api.createApiKey({
        body: {
          metadata: {
            appId,
          },
          userId: ctx.auth.userId,
        },
      })

      const { key, start, createdAt, updatedAt } = apiKey
      return {
        key: {
          appId,
          key,
          start,
          createdAt,
          updatedAt,
        },
      }
    }),

  /**
   * Verify an API key.
   * @param input - Object containing app ID and key to verify
   * @returns Boolean indicating if the key is valid
   */
  verify: userProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/api-keys/verify',
        protect: true,
        tags: ['keys'],
        summary: 'Verify an API key',
      },
    })
    .input(
      z.object({
        appId: z.string(),
        key: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const result = await auth.api.verifyApiKey({
        body: {
          key: input.key,
        },
      })

      const isValid = result.valid && result.key?.metadata?.appId === input.appId
      return {
        isValid,
      }
    }),

  /**
   * Delete the API key for an app.
   * Only accessible by workspace owner.
   * @param input - Object containing app ID
   * @returns Success status
   * @throws {TRPCError} If user is not workspace owner or app not found
   */
  delete: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/api-keys/{appId}',
        protect: true,
        tags: ['keys'],
        summary: 'Delete the API key for an app',
      },
    })
    .input(
      z.object({
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Find the API key for the app
      const allApiKeys = await auth.api.listApiKeys({
        headers: await headers(),
      })
      const apiKey = allApiKeys.find((key) => key.metadata?.appId === input.appId)
      if (!apiKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        })
      }

      await auth.api.deleteApiKey({
        body: {
          keyId: apiKey.id,
        },
        headers: await headers(),
      })
    }),
}
