import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import type { ProviderId } from '@cared/providers'
import { and, desc, eq, isNull } from '@cared/db'
import { db } from '@cared/db/client'
import { ProviderKey, ProviderSettings } from '@cared/db/schema'
import { providerIdSchema, providerKeySchema } from '@cared/providers'

import type { ModelSource } from '../../types'
import {
  decryptProviderKey,
  deleteProviderKeysStateCache,
  encryptProviderKey,
} from '../../operation'
import { userPlainProtectedProcedure } from '../../orpc'
import { modelSourceSchema } from '../../types'
import { checkPermissionsBySource } from './model'

export const providerKeyRouter = {
  /**
   * List provider keys with optional filtering by provider.
   * Accessible by authenticated users with appropriate permissions.
   * @param input - Object containing optional source, providerId
   * @returns List of provider keys
   */
  list: userPlainProtectedProcedure
    .route({
      method: 'GET',
      path: '/provider-keys',
      tags: ['provider-key'],
      summary: 'List provider keys',
    })
    .input(
      z
        .object({
          providerId: providerIdSchema.optional(),
          source: modelSourceSchema.exclude(['effective']).default('custom'),
        })
        .default({
          source: 'custom',
        }),
    )
    .handler(async ({ input, context }) => {
      await checkPermissionsBySource(context, input.source)

      // When accountId is null, it's system-level
      const conditions = [
        input.source === 'custom'
          ? eq(ProviderKey.accountId, context.auth.accountId)
          : isNull(ProviderKey.accountId),
      ]

      if (input.providerId) {
        conditions.push(eq(ProviderKey.providerId, input.providerId))
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

  /**
   * Create a new provider key.
   * Accessible by authenticated users with appropriate permissions.
   * @param input - Object containing key details
   * @returns Created provider key
   */
  create: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/provider-keys',
      tags: ['provider-key'],
      summary: 'Create provider key',
    })
    .input(
      z.object({
        key: providerKeySchema,
        disabled: z.boolean().default(false),
        source: modelSourceSchema.exclude(['effective']).default('custom'),
      }),
    )
    .handler(async ({ input, context }) => {
      await checkPermissionsBySource(context, input.source, { providerKey: ['write'] })

      // Encrypt sensitive fields
      const encryptedKey = await encryptProviderKey(input.key)

      // Create the provider key
      // When accountId is null, it's system-level
      const [newKey] = await db
        .insert(ProviderKey)
        .values({
          accountId: input.source === 'custom' ? context.auth.accountId : undefined,
          providerId: input.key.providerId,
          key: encryptedKey,
          disabled: input.disabled,
        })
        .returning()
      if (!newKey) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to create provider key',
        })
      }

      // When accountId is null, it's system-level
      if (!newKey.accountId) {
        await enableProvider(newKey.providerId)
      }

      // Clear provider key state cache after creating new key
      await deleteProviderKeysStateCache(newKey.providerId, newKey.accountId ?? undefined)

      // Decrypt the key for response
      const decryptedKey = {
        ...newKey,
        key: await decryptProviderKey(newKey.key),
      }

      return {
        providerKey: decryptedKey,
      }
    }),

  /**
   * Update an existing provider key.
   * Accessible by authenticated users with appropriate permissions.
   * @param input - Object containing key id and updates
   * @returns Updated provider key
   */
  update: userPlainProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/provider-keys/{id}',
      tags: ['provider-key'],
      summary: 'Update provider key',
    })
    .input(
      z.object({
        id: z.string(),
        key: providerKeySchema.optional(),
        disabled: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      // Find the existing provider key
      const existingKey = await db.query.ProviderKey.findFirst({
        where: eq(ProviderKey.id, input.id),
      })
      if (!existingKey) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Provider key not found',
        })
      }

      // Determine source based on accountId
      const source: Omit<ModelSource, 'effective'> = existingKey.accountId ? 'custom' : 'system'
      await checkPermissionsBySource(
        context,
        source,
        { providerKey: ['write'] },
        existingKey.accountId,
      )

      const updates = {
        // Encrypt sensitive fields
        ...(input.key ? { key: await encryptProviderKey(input.key) } : {}),
        ...(typeof input.disabled === 'boolean' ? { disabled: input.disabled } : {}),
      }

      // Update the provider key
      const [updatedKey] = await db
        .update(ProviderKey)
        .set(updates)
        .where(eq(ProviderKey.id, input.id))
        .returning()
      if (!updatedKey) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to update provider key',
        })
      }

      // When accountId is null, it's system-level
      if (!updatedKey.accountId) {
        await enableProvider(updatedKey.providerId)
      }

      // Clear provider key state cache after updating key
      await deleteProviderKeysStateCache(updatedKey.providerId, updatedKey.accountId ?? undefined)

      // Decrypt the key for response
      const decryptedKey = {
        ...updatedKey,
        key: await decryptProviderKey(updatedKey.key),
      }

      return {
        providerKey: decryptedKey,
      }
    }),

  /**
   * Delete a provider key.
   * Accessible by authenticated users with appropriate permissions.
   * @param input - Object containing key id
   * @returns Deleted provider key
   */
  delete: userPlainProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/provider-keys/{id}',
      tags: ['provider-key'],
      summary: 'Delete provider key',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ input, context }) => {
      // Find the existing provider key
      const existingKey = await db.query.ProviderKey.findFirst({
        where: eq(ProviderKey.id, input.id),
      })
      if (!existingKey) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Provider key not found',
        })
      }

      // Determine source based on accountId
      const source: Omit<ModelSource, 'effective'> = existingKey.accountId ? 'custom' : 'system'
      await checkPermissionsBySource(
        context,
        source,
        { providerKey: ['write'] },
        existingKey.accountId,
      )

      // Clear provider key state cache before deleting key
      await deleteProviderKeysStateCache(existingKey.providerId, existingKey.accountId ?? undefined)

      // Delete the provider key
      await db.delete(ProviderKey).where(eq(ProviderKey.id, input.id))

      // When accountId is null, it's system-level
      if (!existingKey.accountId) {
        await enableProvider(existingKey.providerId)
      }

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

/**
 * Enable or disable a provider based on system provider keys.
 * @param providerId - Provider ID to enable/disable
 */
async function enableProvider(providerId: ProviderId) {
  // When accountId is null, it's system-level
  const enabled = Boolean(
    await db.query.ProviderKey.findFirst({
      where: and(
        isNull(ProviderKey.accountId),
        eq(ProviderKey.providerId, providerId),
        eq(ProviderKey.disabled, false),
      ),
    }),
  )

  // When accountId is null, it's system-level
  const providerSettings = await db.query.ProviderSettings.findFirst({
    where: isNull(ProviderSettings.accountId),
  })
  if (providerSettings) {
    const settings = providerSettings.settings
    settings.providers[providerId] = {
      enabled,
    }

    await db
      .update(ProviderSettings)
      .set({ settings })
      .where(eq(ProviderSettings.id, providerSettings.id))
  } else {
    await db.insert(ProviderSettings).values({
      accountId: null,
      settings: {
        providers: {
          [providerId]: {
            enabled,
          },
        },
      },
    })
  }
}
