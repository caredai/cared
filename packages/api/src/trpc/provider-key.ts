import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import type { OrganizationStatementsSubset } from '@cared/auth'
import type { SQL } from '@cared/db'
import { and, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { ProviderKey } from '@cared/db/schema'
import { providerIdSchema, providerKeySchema } from '@cared/providers'

import type { UserOrAppUserContext } from '../trpc'
import { OrganizationScope } from '../auth'
import { env } from '../env'
import { userOrAppUserProtectedProcedure } from '../trpc'
import { decryptProviderKey, encryptProviderKey } from '../types'

export const providerKeyRouter = {
  // List provider keys with optional filtering by user or organization
  list: userOrAppUserProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/provider-keys',
        protect: true,
        tags: ['provider-key'],
        summary: 'List provider keys',
        description: 'List provider keys for a user or organization',
      },
    })
    .input(
      z
        .object({
          isSystem: z.boolean().optional(),
          organizationId: z.string().optional(),
          providerId: providerIdSchema.optional(),
        })
        .default({}),
    )
    .query(async ({ input, ctx }) => {
      const { isSystem, organizationId, providerId } = input

      if (
        !(await checkPermissions(ctx, {
          isSystem,
          organizationId,
        }))
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to list provider keys',
        })
      }

      const conditions: SQL<unknown>[] = [
        isSystem
          ? eq(ProviderKey.isSystem, true)
          : !organizationId
            ? eq(ProviderKey.userId, ctx.auth.userId)
            : eq(ProviderKey.organizationId, organizationId),
      ]

      if (providerId) {
        conditions.push(eq(ProviderKey.providerId, providerId))
      }

      const keys = await db.query.ProviderKey.findMany({
        where: and(...conditions),
        orderBy: desc(ProviderKey.id),
      })

      // Decrypt sensitive fields
      const decryptedKeys = await Promise.all(
        keys.map(async (key) => ({
          ...key,
          key: await decryptProviderKey(key.key),
        })),
      )

      return {
        providerKeys: decryptedKeys,
      }
    }),

  // Create a new provider key
  create: userOrAppUserProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/provider-keys',
        protect: true,
        tags: ['provider-key'],
        summary: 'Create provider key',
        description: 'Create a new provider key for a user or organization',
      },
    })
    .input(
      z.object({
        isSystem: z.boolean().optional(),
        organizationId: z.string().optional(),
        key: providerKeySchema, // Use the imported schema instead of manual validation
        disabled: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { isSystem, organizationId, key, disabled } = input

      if (
        !(await checkPermissions(
          ctx,
          {
            isSystem,
            organizationId,
          },
          { providerKey: ['create'] },
        ))
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create provider keys',
        })
      }

      // Encrypt sensitive fields
      const encryptedKey = await encryptProviderKey(key)

      // Create the provider key
      const [newKey] = await db
        .insert(ProviderKey)
        .values({
          isSystem,
          userId: !isSystem && !organizationId ? ctx.auth.userId : undefined,
          organizationId: !isSystem ? organizationId : undefined,
          providerId: key.providerId,
          key: encryptedKey,
          disabled,
        })
        .returning()
      if (!newKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create provider key',
        })
      }

      // Decrypt the key for response
      const decryptedKey = {
        ...newKey,
        key: await decryptProviderKey(newKey.key),
      }

      return {
        providerKey: decryptedKey,
      }
    }),

  // Update an existing provider key
  update: userOrAppUserProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/v1/provider-keys/{id}',
        protect: true,
        tags: ['provider-key'],
        summary: 'Update provider key',
        description: 'Update an existing provider key',
      },
    })
    .input(
      z.object({
        id: z.string(),
        key: providerKeySchema.optional(),
        disabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, key, disabled } = input

      // Find the existing provider key
      const existingKey = await db.query.ProviderKey.findFirst({
        where: eq(ProviderKey.id, id),
      })
      if (!existingKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider key not found',
        })
      }

      if (
        !(await checkPermissions(
          ctx,
          {
            isSystem: existingKey.isSystem,
            userId: existingKey.userId,
            organizationId: existingKey.organizationId,
          },
          { providerKey: ['update'] },
        ))
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own provider keys',
        })
      }

      const updates = {
        // Encrypt sensitive fields
        ...(key ? { key: await encryptProviderKey(key) } : {}),
        ...(typeof disabled === 'boolean' ? { disabled } : {}),
      }

      // Update the provider key
      const [updatedKey] = await db
        .update(ProviderKey)
        .set(updates)
        .where(eq(ProviderKey.id, id))
        .returning()
      if (!updatedKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update provider key',
        })
      }

      // Decrypt the key for response
      const decryptedKey = {
        ...updatedKey,
        key: await decryptProviderKey(updatedKey.key),
      }

      return {
        providerKey: decryptedKey,
      }
    }),

  // Delete a provider key
  delete: userOrAppUserProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/provider-keys/{id}',
        protect: true,
        tags: ['provider-key'],
        summary: 'Delete provider key',
        description: 'Delete an existing provider key',
      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = input

      // Find the existing provider key
      const existingKey = await db.query.ProviderKey.findFirst({
        where: eq(ProviderKey.id, id),
      })
      if (!existingKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider key not found',
        })
      }

      if (
        !(await checkPermissions(
          ctx,
          {
            isSystem: existingKey.isSystem,
            userId: existingKey.userId,
            organizationId: existingKey.organizationId,
          },
          { providerKey: ['delete'] },
        ))
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this provider key',
        })
      }

      // Delete the provider key
      await db.delete(ProviderKey).where(eq(ProviderKey.id, id))

      // Decrypt the key for response
      const decryptedKey = {
        ...existingKey,
        key: await decryptProviderKey(existingKey.key),
      }

      return {
        providerKey: decryptedKey,
      }
    }),
}

async function checkPermissions(
  ctx: UserOrAppUserContext,
  {
    isSystem,
    userId,
    organizationId,
  }: {
    isSystem?: boolean | null
    userId?: string | null
    organizationId?: string | null
  },
  permissions?: OrganizationStatementsSubset,
) {
  if (isSystem) {
    if (!ctx.auth.isAdmin) {
      // Only admin users can access system provider keys
      return false
    }
  } else if (organizationId) {
    if (ctx.auth.appId) {
      // App user cannot access organization provider keys
      return false
    }
    const scope = OrganizationScope.fromOrganization({ db }, organizationId)
    await scope.checkPermissions(permissions)
  } else {
    if (userId && userId !== ctx.auth.userId) {
      // User trying to access another user's provider keys
      return false
    }
    if (ctx.auth.appId && !env.WHITELIST_CARED_APPS?.includes(ctx.auth.appId)) {
      // Users of non-whitelisted apps cannot access user provider keys
      return false
    }
  }

  return true
}
