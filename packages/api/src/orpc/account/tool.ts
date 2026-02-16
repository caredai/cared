import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { getComposio } from '@cared/tools'

import type { ProtectedAuth } from '../../auth'
import type { ConnectionStatus } from '../../types'
import { protectedProcedure, publicProcedure } from '../../orpc'
import {
  ConnectionSchema,
  ConnectionStatuses,
  ConnectionStatusSchema,
  ToolkitAuthConfigDetailsSchema,
  ToolKitSchema,
  ToolSchema,
} from '../../types'

/**
 * Resolve user ID based on the type (user or account).
 * @param auth - Authentication context
 * @param type - Type of identifier to resolve ('user' or 'account')
 * @returns Resolved user ID
 * @throws ORPCError if unable to determine user identifier
 */
function resolveUserId(auth: ProtectedAuth, type: 'user' | 'account'): string {
  const resolvedUserId = type === 'user' ? auth.userId : auth.accountId
  if (!resolvedUserId) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Unable to determine user identifier',
    })
  }
  return resolvedUserId
}

/**
 * Verify that a connection exists and belongs to the user.
 * @param composio - Composio instance
 * @param userId - User ID to verify ownership
 * @param connectionId - Connection ID to verify
 * @throws ORPCError if connection not found
 */
async function verifyConnectionOwnership(
  composio: ReturnType<typeof getComposio>,
  userId: string,
  connectionId: string,
): Promise<void> {
  const { items: connections } = await composio.getClient().connectedAccounts.list({
    user_ids: [userId],
    connected_account_ids: [connectionId],
  })
  if (!connections.length) {
    throw new ORPCError('NOT_FOUND', {
      message: 'Connection not found',
    })
  }
}

/**
 * Validate toolkit slug to ensure it's not a restricted toolkit.
 * Blocks 'composio' toolkit as it's not supported.
 * @param slug - Toolkit slug to validate
 * @throws ORPCError if toolkit slug is restricted
 */
function validateToolkitSlug(slug: string): void {
  if (slug === 'composio') {
    throw new ORPCError('NOT_FOUND', {
      message: 'Toolkit not found',
    })
  }
}

/**
 * Check if a toolkit slug is restricted.
 * Used for filtering toolkits in list operations.
 * @param slug - Toolkit slug to check
 * @returns true if toolkit is allowed, false if restricted
 */
function isToolkitAllowed(slug: string): boolean {
  return slug !== 'composio'
}

/**
 * Validate tool slug to ensure it's not a restricted internal tool.
 * Blocks COMPOSIO_ prefixed tools except COMPOSIO_SEARCH which is allowed.
 * @param slug - Tool slug to validate
 * @throws ORPCError if tool slug is restricted
 */
function validateToolSlug(slug: string): void {
  if (slug.startsWith('COMPOSIO_') && !slug.startsWith('COMPOSIO_SEARCH')) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Tool not found',
    })
  }
}

export const toolRouter = {
  /**
   * List all toolkit categories from Composio.
   * Only accessible by authenticated users.
   * @returns List of categories
   */
  listCategories: publicProcedure
    .route({
      method: 'GET',
      path: '/toolkits/categories',
      tags: ['tool'],
      summary: 'List all toolkit categories',
    })
    .output(
      z.object({
        categories: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
          }),
        ),
      }),
    )
    .handler(async () => {
      const composio = getComposio()
      const { items } = await composio.toolkits.listCategories()

      return {
        categories: items.map((item) => ({
          id: item.id,
          name: item.name,
        })),
      }
    }),

  /**
   * List all toolkits from Composio.
   * Only accessible by authenticated users.
   * @returns List of toolkits
   */
  listToolkits: publicProcedure
    .route({
      method: 'GET',
      path: '/toolkits',
      tags: ['tool'],
      summary: 'List all toolkits',
    })
    .output(
      z.object({
        toolkits: z.array(ToolKitSchema),
      }),
    )
    .handler(async () => {
      const composio = getComposio()
      const toolkits = await composio.toolkits.get({
        sortBy: 'usage',
      })

      // Filter out restricted toolkits
      return {
        toolkits: toolkits
          .filter((item) => isToolkitAllowed(item.slug))
          .map((item) => ({
            name: item.name,
            slug: item.slug,
            meta: item.meta,
            authSchemes: item.authSchemes,
            noAuth: item.noAuth,
          })),
      }
    }),

  /**
   * Get a single toolkit by slug from Composio.
   * Only accessible by authenticated users.
   * @returns Toolkit details
   */
  getToolkit: publicProcedure
    .route({
      method: 'GET',
      path: '/toolkits/{slug}',
      tags: ['tool'],
      summary: 'Get toolkit by slug',
    })
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .output(
      z.object({
        toolkit: z.object({
          ...ToolKitSchema.omit({
            authSchemes: true,
          }).shape,
          authConfigDetails: z.array(ToolkitAuthConfigDetailsSchema).optional(),
        }),
      }),
    )
    .handler(async ({ input }) => {
      validateToolkitSlug(input.slug)

      const composio = getComposio()
      const toolkit = await composio.toolkits.get(input.slug)

      return {
        toolkit: {
          name: toolkit.name,
          slug: toolkit.slug,
          meta: toolkit.meta,
          noAuth: toolkit.authConfigDetails?.at(0)?.mode === 'NO_AUTH',
          authConfigDetails: toolkit.authConfigDetails?.map((c) => ({
            name: c.name,
            mode: c.mode,
            fields: {
              connectionInitiation: c.fields.connectedAccountInitiation,
            },
          })),
        },
      }
    }),

  /**
   * List all tools from Composio.
   * Only accessible by authenticated users.
   * @returns List of tools
   */
  listTools: publicProcedure
    .route({
      method: 'GET',
      path: '/tools',
      tags: ['tool'],
      summary: 'List all tools',
    })
    .input(
      z
        .object({
          toolkits: z.array(z.string()).optional(),
          tools: z.array(z.string()).optional(),
          scopes: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          search: z.string().optional(),
          limit: z.number().default(9999),
        })
        .superRefine((val, ctx) => {
          if ('tools' in val && 'toolkits' in val) {
            ctx.addIssue({
              code: 'custom',
              message: `You should not use tools and toolkits filter together.`,
              input: val,
            })
            return
          }
          if (!('tools' in val || 'toolkits' in val || 'search' in val)) {
            ctx.addIssue({
              code: 'custom',
              message: `At least one of the following parameters is required: tools, toolkits, search.`,
              input: val,
            })
            return
          }
        }),
    )
    .output(
      z.object({
        tools: z.array(ToolSchema),
      }),
    )
    .handler(async ({ input }) => {
      if (input.toolkits) {
        for (const slug of input.toolkits) {
          validateToolkitSlug(slug)
        }
      }
      if (input.tools) {
        for (const slug of input.tools) {
          validateToolSlug(slug)
        }
      }

      const composio = getComposio()
      // @ts-ignore
      const tools = await composio.tools.getRawComposioTools(input)

      return {
        tools,
      }
    }),

  /**
   * Get a single tool by slug from Composio.
   * Only accessible by authenticated users.
   * @returns Tool details
   */
  getTool: publicProcedure
    .route({
      method: 'GET',
      path: '/tools/{slug}',
      tags: ['tool'],
      summary: 'Get tool by slug',
    })
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .output(
      z.object({
        tool: ToolSchema,
      }),
    )
    .handler(async ({ input }) => {
      validateToolSlug(input.slug)

      const composio = getComposio()
      const tool = await composio.tools.getRawComposioToolBySlug(input.slug)

      if (tool.toolkit) {
        validateToolSlug(tool.toolkit.slug)
      }

      return {
        tool,
      }
    }),

  /**
   * Execute a tool from Composio.
   * Only accessible by authenticated users.
   * @returns Tool execution result
   */
  executeTool: protectedProcedure
    .route({
      method: 'POST',
      path: '/tools/execute',
      tags: ['tool'],
      summary: 'Execute a tool',
    })
    .input(
      z.object({
        slug: z.string(),
        arguments: z.record(z.string(), z.unknown()).optional(),
        connectionId: z
          .string(
            'You must specify the connection ID if you have multiple connections for the toolkit',
          )
          .optional(),
        type: z.enum(['user', 'account']).default('user'),
      }),
    )
    .output(
      z.object({
        data: z.record(z.string(), z.unknown()),
        success: z.boolean(),
        error: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      validateToolSlug(input.slug)

      const resolvedUserId = resolveUserId(context.auth, input.type)

      const composio = getComposio()
      const result = await composio.tools.execute(input.slug, {
        userId: resolvedUserId,
        connectedAccountId: input.connectionId,
        arguments: input.arguments,
        dangerouslySkipVersionCheck: true,
      })

      return {
        data: result.data,
        success: result.successful,
        error: result.error ?? undefined,
      }
    }),

  /**
   * Create a connection request for a toolkit through Composio.
   * Determines auth config type based on composioManagedAuthSchemes.
   */
  createConnection: protectedProcedure
    .route({
      method: 'POST',
      path: '/tools/connections',
      tags: ['tool'],
      summary: 'Create connection request for toolkit',
    })
    .input(
      z.object({
        toolkit: z.string(),
        type: z.enum(['user', 'account']).default('user'),
      }),
    )
    .output(
      z.object({
        connection: z.object({
          id: z.string(),
          redirectUrl: z.string().optional(),
          status: ConnectionStatusSchema,
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      validateToolkitSlug(input.toolkit)

      const composio = getComposio()
      const toolkit = await composio.toolkits.get(input.toolkit)
      if (toolkit.authConfigDetails?.at(0)?.mode === 'NO_AUTH') {
        throw new ORPCError('BAD_REQUEST', {
          message: 'The NO_AUTH toolkit does not require connection',
        })
      }

      const resolvedUserId = resolveUserId(context.auth, input.type)

      // Check connection limit for this specific toolkit before creating a new connection
      const MAX_CONNECTIONS_PER_TOOLKIT = 10
      const { items: existingConnections } = await composio.getClient().connectedAccounts.list({
        user_ids: [resolvedUserId],
        toolkit_slugs: [input.toolkit],
      })

      if (existingConnections.length >= MAX_CONNECTIONS_PER_TOOLKIT) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Maximum number of connections (${MAX_CONNECTIONS_PER_TOOLKIT}) reached for toolkit ${input.toolkit}`,
        })
      }

      // Determine if this toolkit uses composio-managed auth
      const isComposioManaged =
        !!toolkit.composioManagedAuthSchemes && toolkit.composioManagedAuthSchemes.length > 0

      const authConfigName = `${toolkit.name} Auth Config`

      const findAuthConfigId = async (isComposioManaged: boolean) => {
        let cursor: string | undefined

        do {
          const response = await composio.authConfigs.list({
            toolkit: input.toolkit,
            isComposioManaged,
            cursor,
          })

          const match = response.items.find((item) => item.name === authConfigName)
          if (match) {
            return match.id
          }

          cursor = response.nextCursor ?? undefined
        } while (cursor)

        return undefined
      }

      let authConfigId = await findAuthConfigId(isComposioManaged)

      // If no existing auth config found, create one
      if (!authConfigId) {
        if (isComposioManaged) {
          // Use composio-managed auth
          const authConfig = await composio.authConfigs.create(input.toolkit, {
            type: 'use_composio_managed_auth',
            name: authConfigName,
          })
          authConfigId = authConfig.id
        } else {
          // Use custom auth - find an authConfigDetail with no required fields for authConfigCreation
          const suitableAuthConfig = toolkit.authConfigDetails?.find((detail) => {
            // Check if authConfigCreation has no required fields
            return detail.fields.authConfigCreation.required.length === 0
          })

          if (!suitableAuthConfig) {
            throw new ORPCError('BAD_REQUEST', {
              message:
                'Cannot automatically create auth config: all available auth schemes require parameters. Please contact support to manually create an auth config.',
            })
          }

          // Create custom auth config with empty credentials since no required fields
          const authConfig = await composio.authConfigs.create(input.toolkit, {
            type: 'use_custom_auth',
            name: authConfigName,
            authScheme: suitableAuthConfig.mode as any,
            credentials: {},
          })
          authConfigId = authConfig.id
        }
      }

      if (!authConfigId) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to resolve auth config for connection request',
        })
      }

      const connectionRequest = await composio.connectedAccounts.link(resolvedUserId, authConfigId)
      const requestData = connectionRequest.toJSON()

      return {
        connection: {
          id: requestData.id,
          redirectUrl: requestData.redirectUrl ?? undefined,
          status:
            (requestData.status as ConnectionStatus | undefined) ?? ConnectionStatuses.INITIALIZING,
        },
      }
    }),

  /**
   * List connected accounts from Composio.
   * Only accessible by authenticated users.
   * @returns List of connected accounts
   */
  listConnections: protectedProcedure
    .route({
      method: 'GET',
      path: '/tools/connections',
      tags: ['tool'],
      summary: 'List connected accounts',
    })
    .input(
      z.object({
        toolkits: z.array(z.string()).optional(),
        limit: z.number().default(20),
        cursor: z.string().optional(),
        statuses: z.array(ConnectionStatusSchema).optional(),
        type: z.enum(['user', 'account']).default('user'),
      }),
    )
    .output(
      z.object({
        connections: z.array(ConnectionSchema),
        hasMore: z.boolean(),
        cursor: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const resolvedUserId = resolveUserId(context.auth, input.type)

      const composio = getComposio()

      const response = await composio.connectedAccounts.list({
        userIds: [resolvedUserId],
        toolkitSlugs: input.toolkits,
        limit: input.limit,
        cursor: input.cursor,
        statuses: input.statuses,
        orderBy: 'created_at',
      })

      return {
        connections: response.items.map((item) => ({
          id: item.id,
          status: item.status,
          statusReason: item.statusReason ?? undefined,
          toolkit: item.toolkit.slug,
          state: item.state,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
        hasMore: !!response.nextCursor,
        cursor: response.nextCursor ?? undefined,
      }
    }),

  /**
   * Get a single connected account by ID from Composio.
   * Only accessible by authenticated users.
   * @returns Connected account details
   */
  getConnection: protectedProcedure
    .route({
      method: 'GET',
      path: '/tools/connections/{id}',
      tags: ['tool'],
      summary: 'Get connected account by ID',
    })
    .input(
      z.object({
        id: z.string(),
        type: z.enum(['user', 'account']).default('user'),
      }),
    )
    .output(
      z.object({
        connection: ConnectionSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      const resolvedUserId = resolveUserId(context.auth, input.type)

      const composio = getComposio()

      // Verify that the connection exists and belongs to the user
      await verifyConnectionOwnership(composio, resolvedUserId, input.id)

      const connection = await composio.connectedAccounts.get(input.id)

      return {
        connection: {
          id: connection.id,
          status: connection.status,
          statusReason: connection.statusReason ?? undefined,
          toolkit: connection.toolkit.slug,
          state: connection.state,
          createdAt: new Date(connection.createdAt),
          updatedAt: new Date(connection.updatedAt),
        },
      }
    }),

  /**
   * Delete a connected account from Composio.
   * Only accessible by authenticated users.
   */
  deleteConnection: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/tools/connections/{id}',
      tags: ['tool'],
      summary: 'Delete connected account',
    })
    .input(
      z.object({
        id: z.string(),
        type: z.enum(['user', 'account']).default('user'),
      }),
    )
    .handler(async ({ context, input }) => {
      const resolvedUserId = resolveUserId(context.auth, input.type)

      const composio = getComposio()

      // Verify that the connection exists and belongs to the user
      await verifyConnectionOwnership(composio, resolvedUserId, input.id)

      const { success } = await composio.connectedAccounts.delete(input.id)
      if (!success) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to delete connection',
        })
      }
    }),

  /**
   * Refresh a connected account's authentication credentials from Composio.
   * Only accessible by authenticated users.
   * @returns Refreshed connected account details
   */
  refreshConnection: protectedProcedure
    .route({
      method: 'POST',
      path: '/tools/connections/{id}/refresh',
      tags: ['tool'],
      summary: 'Refresh connected account credentials',
    })
    .input(
      z.object({
        id: z.string(),
        type: z.enum(['user', 'account']).default('user'),
      }),
    )
    .output(
      z.object({
        connection: z.object({
          id: z.string(),
          redirectUrl: z.string().optional(),
          status: ConnectionStatusSchema,
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const resolvedUserId = resolveUserId(context.auth, input.type)

      const composio = getComposio()

      // Verify that the connection exists and belongs to the user
      await verifyConnectionOwnership(composio, resolvedUserId, input.id)

      const result = await composio.connectedAccounts.refresh(input.id)

      return {
        connection: {
          id: result.id,
          redirectUrl: result.redirect_url ?? undefined,
          status: result.status,
        },
      }
    }),

  /**
   * Update the status of a connected account in Composio.
   * Only accessible by authenticated users.
   * @returns Updated connected account details
   */
  updateConnection: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/tools/connections/{id}',
      tags: ['tool'],
      summary: 'Update connected account status',
    })
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean(),
        type: z.enum(['user', 'account']).default('user'),
      }),
    )
    .handler(async ({ context, input }) => {
      const resolvedUserId = resolveUserId(context.auth, input.type)

      const composio = getComposio()

      // Verify that the connection exists and belongs to the user
      await verifyConnectionOwnership(composio, resolvedUserId, input.id)

      const { success } = await composio.connectedAccounts.updateStatus(input.id, {
        enabled: input.enabled,
      })
      if (!success) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to update connection',
        })
      }
    }),
}
