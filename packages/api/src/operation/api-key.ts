import { base64Url } from '@better-auth/utils/base64'
import { createHash } from '@better-auth/utils/hash'
import { z } from 'zod/v4'

import { auth, headers } from '@cared/auth'
import { eq, inArray } from '@cared/db'
import { getDb } from '@cared/db/client'
import { ApiKey } from '@cared/db/schema'

import type { BaseContext } from '../orpc'
import type { ApiKeyMetadata } from '../types'
import { Cache } from './cache'

export const apiKeyMetadataSchema = z.discriminatedUnion('scope', [
  z.object({
    scope: z.literal('user'),
  }),
  z.object({
    scope: z.literal('organization'),
    organizationId: z.string(),
  }),
  z.object({
    scope: z.literal('workspace'),
    workspaceId: z.string(),
  }),
  z.object({
    scope: z.literal('app'),
    appId: z.string(),
  }),
])

export type ApiKeyMetadataInput = z.infer<typeof apiKeyMetadataSchema>

export const optionalApiKeyMetadataSchema = z
  .discriminatedUnion('scope', [
    z.object({
      scope: z.literal('user'),
    }),
    z.object({
      scope: z.literal('organization'),
      organizationId: z.string().optional(),
    }),
    z.object({
      scope: z.literal('workspace'),
      workspaceId: z.string().optional(),
    }),
    z.object({
      scope: z.literal('app'),
      appId: z.string().optional(),
    }),
  ])
  .optional()

export type OptionalApiKeyMetadataInput = z.infer<typeof optionalApiKeyMetadataSchema>

export function formatApiKey(key: {
  id: string
  name: string | null
  userId: string
  metadata: Record<string, any> | string | null
  start: string | null
  createdAt: Date
  updatedAt: Date
}) {
  const { userId: _, metadata, ...result } = _formatApiKey(key)
  return {
    ...result,
    ...metadata,
  }
}

function _formatApiKey(key: Parameters<typeof formatApiKey>[0]) {
  const metadata = // NOTE: metadata is stringified twice in better-auth
    (
      typeof key.metadata === 'string' ? JSON.parse(JSON.parse(key.metadata)) : key.metadata
    ) as ApiKeyMetadata

  return {
    id: key.id,
    name: key.name ?? '',
    userId: key.userId,
    metadata,
    start: key.start ?? '',
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
  }
}

const cache = new Cache<ApiKey>('apiKey', async (key) => ({
  value: await getDb().query.ApiKey.findFirst({
    where: eq(ApiKey.key, key),
  }),
}))

export async function invalidateApiKeyCache(apiKeyHash: string) {
  await cache.invalidate(apiKeyHash)
}

export async function getApiKey(apiKey: string) {
  // See: https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/api-key/routes/verify-api-key.ts
  const hash = await createHash('SHA-256').digest(new TextEncoder().encode(apiKey))
  const hashed = base64Url.encode(new Uint8Array(hash), {
    padding: false,
  })

  const key = await cache.get(hashed)
  if (key) {
    return _formatApiKey(key)
  }
}

export async function listApiKeys(
  ctx: BaseContext,
  input: z.infer<typeof optionalApiKeyMetadataSchema>,
) {
  const allApiKeys = await auth.api.listApiKeys({
    headers: headers(ctx.headers),
  })

  let filteredKeys = allApiKeys

  // Filter by scope if provided
  if (input?.scope) {
    filteredKeys = allApiKeys.filter((key) => key.metadata?.scope === input.scope)

    // Additional filtering based on scope
    switch (input.scope) {
      case 'organization':
        if (input.organizationId) {
          filteredKeys = filteredKeys.filter(
            (key) => key.metadata?.organizationId === input.organizationId,
          )
        } else {
          filteredKeys = []
        }
        break
      case 'workspace':
        if (input.workspaceId) {
          filteredKeys = filteredKeys.filter(
            (key) => key.metadata?.workspaceId === input.workspaceId,
          )
        } else {
          filteredKeys = []
        }
        break
      case 'app':
        if (input.appId) {
          filteredKeys = filteredKeys.filter((key) => key.metadata?.appId === input.appId)
        } else {
          filteredKeys = []
        }
        break
    }
  }

  return filteredKeys.sort((a, b) => b.id.localeCompare(a.id)).map(formatApiKey)
}

export async function deleteApiKeys(
  ctx: BaseContext,
  input: z.infer<typeof optionalApiKeyMetadataSchema>,
) {
  const apiKeys = await listApiKeys(ctx, input)
  if (apiKeys.length === 0) {
    return
  }

  await getDb()
    .delete(ApiKey)
    .where(
      inArray(
        ApiKey.id,
        apiKeys.map((key) => key.id),
      ),
    )

  // Call again to check
  await deleteApiKeys(ctx, input)
}
