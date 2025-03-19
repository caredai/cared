import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { sha256 } from 'viem'
import { z } from 'zod'

import { ApiKey } from '@mindworld/db/schema'
import { log } from '@mindworld/log'
import { decrypt, encrypt, KEY_SEPARATOR, KeyV1 } from '@mindworld/shared'

import type { Context } from '../trpc'
import { userProtectedProcedure } from '../trpc'
import { getAppById } from './app'
import { verifyWorkspaceOwner } from './workspace'

/**
 * Get the API key for an app from the database.
 * @param ctx - The context object containing database connection
 * @param appId - The app ID
 * @returns The API key if found, undefined if not found
 */
async function getApiKey(ctx: Context, appId: string) {
  const key = await ctx.db.query.ApiKey.findFirst({
    where: eq(ApiKey.appId, appId),
  })

  if (!key) {
    return undefined
  }

  const decryptedKey = decrypt(key.key)
  const [prefix] = decryptedKey.split(KEY_SEPARATOR)

  return {
    appId: key.appId,
    keyStart: decryptedKey.slice(0, (prefix?.length ?? 0) + 5),
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
  }
}

/**
 * Verify if a provided key matches the stored hash for an app.
 * @param ctx - The context object containing database connection
 * @param appId - The app ID
 * @param key - The key to verify
 * @returns Boolean indicating if the key is valid
 */
export async function verifyApiKey(ctx: Context, appId: string, key: string): Promise<boolean> {
  const apiKey = await ctx.db.query.ApiKey.findFirst({
    where: eq(ApiKey.appId, appId),
  })
  if (!apiKey) return false

  // Hash the provided key for comparison
  const hash = sha256(new TextEncoder().encode(key))

  // Compare the hashes
  return apiKey.hash === hash
}

export async function getAppIdByApiKey(ctx: Context, key: string): Promise<string | undefined> {
  const hash = sha256(new TextEncoder().encode(key))
  const apiKey = await ctx.db.query.ApiKey.findFirst({
    where: eq(ApiKey.hash, hash),
  })
  return apiKey?.appId
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

      const key = await getApiKey(ctx, app.id)
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

      const key = await getApiKey(ctx, app.id)
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
      const existingKey = await getApiKey(ctx, app.id)
      if (existingKey) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'App already has an API key',
        })
      }

      // Generate new API key
      const rawKey = new KeyV1({ byteLength: 16, prefix: 'sk' }).toString()

      // Encrypt the key for storage
      const encryptedKey = encrypt(rawKey)

      // Hash the key for verification
      const hash = sha256(new TextEncoder().encode(rawKey))

      // Store key hash and encrypted key in database
      const [key] = await ctx.db
        .insert(ApiKey)
        .values({
          appId: app.id,
          hash,
          key: encryptedKey,
        })
        .returning()
      if (!key) {
        log.error('Failed to create API key')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create API key',
        })
      }

      delete (key as any).hash
      return {
        key: {
          ...(key as Omit<ApiKey, 'hash'>),
          key: rawKey,
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
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Check if app has an existing key
      const existingKey = await getApiKey(ctx, app.id)
      if (!existingKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        })
      }

      // Generate new API key
      const rawKey = new KeyV1({ byteLength: 16, prefix: 'sk' }).toString()

      // Encrypt the key for storage
      const encryptedKey = encrypt(rawKey)

      // Hash the key for verification
      const hash = sha256(new TextEncoder().encode(rawKey))

      // Update key in database
      const [key] = await ctx.db
        .update(ApiKey)
        .set({
          hash,
          key: encryptedKey,
        })
        .where(eq(ApiKey.appId, app.id))
        .returning()
      if (!key) {
        log.error('Failed to rotate API key')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to rotate API key',
        })
      }

      delete (key as any).hash
      return {
        key: {
          ...(key as Omit<ApiKey, 'hash'>),
          key: rawKey,
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
      const valid = await verifyApiKey(ctx, input.appId, input.key)
      return { valid }
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
      const key = await getApiKey(ctx, app.id)
      if (!key) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        })
      }

      // Delete the key from database
      await ctx.db.delete(ApiKey).where(eq(ApiKey.appId, app.id))
    }),
}
