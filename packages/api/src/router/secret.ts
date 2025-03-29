import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { ProviderId } from '@ownxai/providers'
import { eq } from '@ownxai/db'
import { db } from '@ownxai/db/client'
import { UserSecret, WorkspaceSecret } from '@ownxai/db/schema'
import { providers } from '@ownxai/providers/providers'
import { decrypt, encrypt } from '@ownxai/shared'

import { env } from '../env'
import { userProtectedProcedure } from '../trpc'
import { verifyWorkspaceOwner } from './workspace'

const providerIdSchema = z.enum(Object.keys(providers) as [ProviderId, ...ProviderId[]])

export const secretRouter = {
  // Check if provider API key exists
  hasProviderKey: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/secrets/has-provider-key',
        protect: true,
        tags: ['secret'],
        summary: 'Check if provider API key exists',
        description: 'Check if the API key for a specific provider exists for a user or workspace',
      },
    })
    .input(
      z.object({
        providerId: providerIdSchema,
        workspaceId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { providerId, workspaceId } = input
      const userId = ctx.auth.userId

      let secret
      if (!workspaceId) {
        // Get user secret
        const userSecret = await db.query.UserSecret.findFirst({
          where: eq(UserSecret.userId, userId),
        })
        if (!userSecret) {
          return { exists: false }
        }

        secret = userSecret.secret
      } else {
        await verifyWorkspaceOwner(ctx, workspaceId)

        // Get workspace secret
        const workspaceSecret = await db.query.WorkspaceSecret.findFirst({
          where: eq(WorkspaceSecret.workspaceId, workspaceId),
        })
        if (!workspaceSecret) {
          return { exists: false }
        }

        secret = workspaceSecret.secret
      }

      const key = secret.providerKeys?.[providerId]
      return { exists: Boolean(key) }
    }),

  // Get provider API key
  getProviderKey: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/secrets/provider-key',
        protect: true,
        tags: ['secret'],
        summary: 'Get provider API key',
        description: 'Get the API key for a specific provider for a user or workspace',
      },
    })
    .input(
      z.object({
        providerId: providerIdSchema,
        workspaceId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { providerId, workspaceId } = input
      const userId = ctx.auth.userId

      let secret
      if (!workspaceId) {
        // Get user secret
        const userSecret = await db.query.UserSecret.findFirst({
          where: eq(UserSecret.userId, userId),
        })
        if (!userSecret) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Provider api key not found',
          })
        }

        secret = userSecret.secret
      } else {
        await verifyWorkspaceOwner(ctx, workspaceId)

        // Get workspace secret
        const workspaceSecret = await db.query.WorkspaceSecret.findFirst({
          where: eq(WorkspaceSecret.workspaceId, workspaceId),
        })
        if (!workspaceSecret) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Provider api key not found',
          })
        }

        secret = workspaceSecret.secret
      }

      const key = secret.providerKeys?.[providerId]
      if (!key) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider api key not found',
        })
      }

      return {
        apiKeyStart: (await decrypt(env.ENCRYPTION_KEY, key)).slice(0, 4),
      }
    }),

  // Set provider API key
  setProviderKey: userProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/secrets/provider-key',
        protect: true,
        tags: ['secret'],
        summary: 'Set provider API key',
        description: 'Set the API key for a specific provider for a user or workspace',
      },
    })
    .input(
      z.object({
        providerId: providerIdSchema,
        apiKey: z.string(),
        workspaceId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { providerId, apiKey, workspaceId } = input
      const userId = ctx.auth.userId

      // Encrypt API key
      const encryptedKey = await encrypt(env.ENCRYPTION_KEY, apiKey)

      if (!workspaceId) {
        // Check if user secret exists
        const existingSecret = await db.query.UserSecret.findFirst({
          where: eq(UserSecret.userId, userId),
        })

        if (existingSecret) {
          // Update existing secret
          const updatedSecret = {
            ...existingSecret.secret,
            providerKeys: {
              ...existingSecret.secret.providerKeys,
              [providerId]: encryptedKey,
            },
          }

          await db
            .update(UserSecret)
            .set({ secret: updatedSecret })
            .where(eq(UserSecret.userId, userId))
        } else {
          // Create new secret
          await db.insert(UserSecret).values({
            userId,
            secret: {
              providerKeys: {
                [providerId]: encryptedKey,
              },
            },
          })
        }
      } else {
        await verifyWorkspaceOwner(ctx, workspaceId)

        // Check if workspace secret exists
        const existingSecret = await db.query.WorkspaceSecret.findFirst({
          where: eq(WorkspaceSecret.workspaceId, workspaceId),
        })

        if (existingSecret) {
          // Update existing secret
          const updatedSecret = {
            ...existingSecret.secret,
            providerKeys: {
              ...existingSecret.secret.providerKeys,
              [providerId]: encryptedKey,
            },
          }

          await db
            .update(WorkspaceSecret)
            .set({ secret: updatedSecret })
            .where(eq(WorkspaceSecret.workspaceId, workspaceId))
        } else {
          // Create new secret
          await db.insert(WorkspaceSecret).values({
            workspaceId,
            secret: {
              providerKeys: {
                [providerId]: encryptedKey,
              },
            },
          })
        }
      }
    }),

  // Delete provider API key
  deleteProviderKey: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/secrets/provider-key',
        protect: true,
        tags: ['secret'],
        summary: 'Delete provider API key',
        description: 'Delete the API key for a specific provider for a user or workspace',
      },
    })
    .input(
      z.object({
        providerId: providerIdSchema,
        workspaceId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { providerId, workspaceId } = input
      const userId = ctx.auth.userId

      if (!workspaceId) {
        // Find user secret
        const existingSecret = await db.query.UserSecret.findFirst({
          where: eq(UserSecret.userId, userId),
        })

        // Create new providerKeys object, excluding the key to delete
        const { [providerId]: providerKey, ...remainingKeys } =
          existingSecret?.secret.providerKeys ?? {}
        if (!providerKey) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Provider api key not found',
          })
        }

        // Update secret
        await db
          .update(UserSecret)
          .set({
            secret: {
              ...existingSecret?.secret,
              providerKeys: remainingKeys,
            },
          })
          .where(eq(UserSecret.userId, userId))
      } else {
        await verifyWorkspaceOwner(ctx, workspaceId)

        // Find workspace secret
        const existingSecret = await db.query.WorkspaceSecret.findFirst({
          where: eq(WorkspaceSecret.workspaceId, workspaceId),
        })

        // Create new providerKeys object, excluding the key to delete
        const { [providerId]: providerKey, ...remainingKeys } =
          existingSecret?.secret.providerKeys ?? {}
        if (!providerKey) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Provider api key not found',
          })
        }

        // Update secret
        await db
          .update(WorkspaceSecret)
          .set({
            secret: {
              ...existingSecret?.secret,
              providerKeys: remainingKeys,
            },
          })
          .where(eq(WorkspaceSecret.workspaceId, workspaceId))
      }
    }),
}
