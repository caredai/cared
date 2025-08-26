import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import { auth } from '@cared/auth'
import { eq } from '@cared/db'
import { App, Workspace } from '@cared/db/schema'

import type { UserContext } from '../trpc'
import type { ApiKeyMetadata, ApiKeyScope } from '../types'
import { OrganizationScope } from '../auth'
import { cfg } from '../config'
import {
  apiKeyMetadataSchema,
  formatApiKey,
  listApiKeys,
  optionalApiKeyMetadataSchema,
} from '../operation'
import { userPlainProtectedProcedure } from '../trpc'

async function checkCreationPermission(ctx: UserContext, metadata: ApiKeyMetadata) {
  // User scoped API keys always allow creation
  if (metadata.scope === 'user') {
    return
  }

  // For non-user scoped API keys, check organization permissions
  let organizationScope: OrganizationScope

  switch (metadata.scope) {
    case 'organization':
      organizationScope = OrganizationScope.fromOrganization(
        { db: ctx.db },
        metadata.organizationId,
      )
      break
    case 'workspace': {
      organizationScope = await OrganizationScope.fromWorkspace(
        { db: ctx.db },
        metadata.workspaceId,
        metadata.organizationId,
      )
      break
    }
    case 'app': {
      organizationScope = await OrganizationScope.fromApp(
        { db: ctx.db },
        metadata.appId,
        metadata.workspaceId,
        metadata.organizationId,
      )
      break
    }
  }

  await organizationScope.checkPermissions()
}

function apiKeyPrefix(scope: ApiKeyScope) {
  switch (scope) {
    case 'user':
      return 'sk_u_'
    case 'organization':
      return 'sk_o_'
    case 'workspace':
      return 'sk_w_'
    case 'app':
      return 'sk_a_'
  }
}

export const apiKeyRouter = {
  /**
   * List API keys for all scopes or for a specific scope.
   * Only accessible by authenticated users with appropriate permissions.
   * @param input - Object containing optional scope and related IDs
   * @returns List of API keys
   * @throws {TRPCError} If user doesn't have permission for the requested scope
   */
  list: userPlainProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/api-keys',
        protect: true,
        tags: ['keys'],
        summary: 'List all API keys for a scope',
      },
    })
    .input(optionalApiKeyMetadataSchema)
    .query(async ({ input }) => {
      const apiKeys = await listApiKeys(input)

      return {
        keys: apiKeys,
      }
    }),

  /**
   * Check if an entity has an API key.
   * Only accessible by users with appropriate permissions.
   * @param input - Object containing scope and entity ID
   * @returns Boolean indicating if the entity has an API key
   * @throws {TRPCError} If user doesn't have permission or entity not found
   */
  has: userPlainProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/api-keys/{id}/exists',
        protect: true,
        tags: ['keys'],
        summary: 'Check if an entity has an API key',
      },
    })
    .input(optionalApiKeyMetadataSchema)
    .query(async ({ input }) => {
      const apiKeys = await listApiKeys(input)

      return { exists: apiKeys.length > 0 }
    }),

  /**
   * Get API key for an entity.
   * Only accessible by users with appropriate permissions.
   * @param input - Object containing scope and entity ID
   * @returns The API key if found
   * @throws {TRPCError} If user doesn't have permission or entity not found
   */
  get: userPlainProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/api-keys/{scope}/{id}',
        protect: true,
        tags: ['keys'],
        summary: 'Get API key for an entity',
      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const apiKey = await auth.api.getApiKey({
        query: {
          id: input.id,
        },
      })

      return {
        key: formatApiKey(apiKey),
      }
    }),

  /**
   * Create a new API key for an entity.
   * Only accessible by users with appropriate permissions.
   * Note: Workspace and app scopes only allow one API key per entity.
   * User and organization scopes allow multiple API keys.
   * @param input - Object containing scope and entity details
   * @returns The created API key
   * @throws {TRPCError} If user doesn't have permission, entity not found, or if trying to create duplicate for workspace/app scope
   */
  create: userPlainProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/api-keys',
        protect: true,
        tags: ['keys'],
        summary: 'Create a new API key for an entity',
      },
    })
    .input(
      z
        .object({
          name: z.string().min(1),
        })
        .and(apiKeyMetadataSchema),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, ...others } = input
      const metadata = others as ApiKeyMetadata

      switch (metadata.scope) {
        case 'workspace': {
          const workspace = await ctx.db.query.Workspace.findFirst({
            where: eq(Workspace.id, metadata.workspaceId),
          })
          if (!workspace) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Workspace not found',
            })
          }
          metadata.organizationId = workspace.organizationId
          break
        }
        case 'app': {
          const [result] = await ctx.db
            .select({
              workspaceId: Workspace.id,
              organizationId: Workspace.organizationId,
            })
            .from(App)
            .innerJoin(Workspace, eq(Workspace.id, App.workspaceId))
            .where(eq(App.id, metadata.appId))
            .limit(1)
          if (!result) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'App not found',
            })
          }
          metadata.workspaceId = result.workspaceId
          metadata.organizationId = result.organizationId
        }
      }

      const allApiKeys = await auth.api.listApiKeys()

      await checkCreationPermission(ctx, metadata)

      // Check API key count limits based on scope
      const existingKeys = allApiKeys.filter((key) => {
        if (key.metadata?.scope !== metadata.scope) return false

        switch (metadata.scope) {
          case 'user':
            return true // All user-scoped keys for the current user
          case 'organization':
            return key.metadata.organizationId === metadata.organizationId
          case 'workspace':
            return key.metadata.workspaceId === metadata.workspaceId
          case 'app':
            return key.metadata.appId === metadata.appId
          default:
            return false
        }
      })

      // Get the maximum allowed API keys for the scope
      let maxAllowed: number
      switch (metadata.scope) {
        case 'user':
          maxAllowed = cfg.perUser.maxApiKeys
          break
        case 'organization':
          maxAllowed = cfg.perOrganization.maxApiKeys
          break
        case 'workspace':
          maxAllowed = cfg.perWorkspace.maxApiKeys
          break
        case 'app':
          maxAllowed = cfg.perApp.maxApiKeys
          break
        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid scope',
          })
      }

      // Check if the limit would be exceeded
      if (existingKeys.length >= maxAllowed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Maximum number of API keys (${maxAllowed}) for ${metadata.scope} scope has been reached`,
        })
      }

      const apiKey = await auth.api.createApiKey({
        body: {
          name,
          prefix: apiKeyPrefix(metadata.scope),
          metadata,
        },
      })

      return {
        key: {
          ...formatApiKey(apiKey),
          key: apiKey.key,
        },
      }
    }),

  /**
   * Rotate (regenerate) the API key for an entity.
   * Only accessible by users with appropriate permissions.
   * @param input - Object containing scope and entity ID
   * @returns The new API key
   * @throws {TRPCError} If user doesn't have permission or entity not found
   */
  rotate: userPlainProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/v1/api-keys/{scope}/{id}/rotate',
        protect: true,
        tags: ['keys'],
        summary: 'Rotate (regenerate) API key for an entity',
      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const existingApiKey = await auth.api.getApiKey({
        query: {
          id: input.id,
        },
      })

      // Delete existing key
      await auth.api.deleteApiKey({
        body: {
          keyId: existingApiKey.id,
        },
      })

      // Create new API key with same metadata
      const apiKey = await auth.api.createApiKey({
        body: {
          name: existingApiKey.name!,
          prefix: apiKeyPrefix(existingApiKey.metadata?.scope),
          metadata: existingApiKey.metadata,
        },
      })

      return {
        key: {
          ...formatApiKey(apiKey),
          key: apiKey.key,
        },
      }
    }),

  /**
   * Verify an API key.
   * @param input - Object containing key to verify
   * @returns Boolean indicating if the key is valid
   */
  verify: userPlainProtectedProcedure
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
        key: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await auth.api.verifyApiKey({
        body: {
          key: input.key,
        },
      })

      return {
        isValid: result.valid,
      }
    }),

  /**
   * Delete the API key for an entity.
   * Only accessible by users with appropriate permissions.
   * @param input - Object containing scope and entity ID
   * @returns Success status
   * @throws {TRPCError} If user doesn't have permission or entity not found
   */
  delete: userPlainProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/api-keys/{scope}/{id}',
        protect: true,
        tags: ['keys'],
        summary: 'Delete the API key for an entity',
      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const apiKey = await auth.api.getApiKey({
        query: {
          id: input.id,
        },
      })

      await auth.api.deleteApiKey({
        body: {
          keyId: apiKey.id,
        },
      })
    }),
}
