import { TRPCError } from '@trpc/server'
import { Unkey } from '@unkey/api'
import { z } from 'zod'

import { log } from '@mindworld/log'

import { env } from '../env'
import { userProtectedProcedure } from '../trpc'
import { getAppById } from './app'
import { verifyWorkspaceOwner } from './workspace'

const unkey = new Unkey({ rootKey: env.UNKEY_ROOT_KEY, disableTelemetry: true })
const unkeyApiId = env.UNKEY_API_ID

/**
 * Get the API key for an app.
 * @param appId - The app ID
 * @returns The API key if found, null if not found
 * @throws {TRPCError} If failed to get API key
 */
async function getAppKey(appId: string) {
  const { result, error } = await unkey.apis.listKeys({
    apiId: unkeyApiId,
    ownerId: appId,
    decrypt: true,
    limit: 1,
  })
  if (error) {
    log.error('Failed to get API key', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get API key',
    })
  }

  const key = result.keys[0]
  if (!key) {
    return null
  }

  return {
    // The key ID.
    id: key.id,
    // The first few characters of the key. This can be useful when displaying it your users, so they can match it.
    prefix: key.start,
    // The key.
    key: key.plaintext,
    // When the key was created, unix timestamp in milliseconds.
    createdAt: key.createdAt,
  }
}

export const apiKeyRouter = {
  /**
   * List API keys for all apps in a workspace.
   * Only accessible by workspace owner.
   * @param input - Object containing app ID
   * @returns List of API keys
   * @throws {TRPCError} If user is not workspace owner
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
        appId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const key = await getAppKey(app.id)
      if (!key) {
        return { keys: [] }
      }

      return {
        keys: [key],
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
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const key = await getAppKey(app.id)
      if (!key) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        })
      }

      return { key }
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
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Check if app already has a key
      const existingKey = await getAppKey(app.id)
      if (existingKey) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'App already has an API key',
        })
      }

      const { error } = await unkey.keys.create({
        apiId: unkeyApiId,
        ownerId: app.id,
        // Allows you to retrieve and display the plaintext key later.
        recoverable: true,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create API key',
        })
      }

      const key = await getAppKey(app.id)
      if (!key) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get API key',
        })
      }

      return {
        key,
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

      // Get the key to delete
      const key = await getAppKey(app.id)
      if (!key) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        })
      }

      const { error } = await unkey.keys.delete({
        keyId: key.id,
        permanent: true,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete API key',
        })
      }
    }),
}
