import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { and, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Mcp } from '@cared/db/schema'
import { getComposio } from '@cared/tools'

import { protectedProcedure } from '../../orpc'

/**
 * McpConfiguration schema for validation
 */
const McpConfigurationSchema = z.object({
  toolkits: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
})

/**
 * Validate toolkits and tools configuration
 * @param toolkits - Array of toolkit slugs
 * @param tools - Array of tool slugs
 * @throws ORPCError if validation fails
 */
async function validateConfiguration(
  toolkits: string[] | undefined,
  tools: string[] | undefined,
): Promise<void> {
  const composio = getComposio()

  // If tools are specified, toolkits must also be specified
  if (tools && tools.length > 0) {
    if (!toolkits || toolkits.length === 0) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Toolkits must be specified when tools are provided',
      })
    }
  }

  // Validate toolkits if specified
  if (toolkits && toolkits.length > 0) {
    const allToolkits = await composio.toolkits.get({})
    const availableToolkitSlugs = new Set(allToolkits.map((toolkit) => toolkit.slug))

    const invalidToolkits = toolkits.filter((toolkit) => !availableToolkitSlugs.has(toolkit))

    if (invalidToolkits.length > 0) {
      throw new ORPCError('BAD_REQUEST', {
        message: `The following toolkits are invalid: ${invalidToolkits.join(', ')}`,
      })
    }
  }

  // Validate tools if specified
  if (tools && tools.length > 0 && toolkits && toolkits.length > 0) {
    // Fetch tools from each toolkit separately to avoid missing tools due to limit
    const availableToolSlugs = new Set<string>()

    for (const toolkit of toolkits) {
      const toolsForToolkit = await composio.tools.getRawComposioTools({
        toolkits: [toolkit],
        limit: 1000,
      })

      toolsForToolkit.forEach((tool) => {
        availableToolSlugs.add(tool.slug)
      })
    }

    // Check if all specified tools are in the available tools
    const invalidTools = tools.filter((tool) => !availableToolSlugs.has(tool))

    if (invalidTools.length > 0) {
      throw new ORPCError('BAD_REQUEST', {
        message: `The following tools do not belong to the specified toolkits: ${invalidTools.join(', ')}`,
      })
    }
  }
}

export const mcpRouter = {
  /**
   * List all MCP servers for the current account.
   * Only accessible by authenticated users with read permission.
   * @returns List of MCP servers
   */
  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/mcp-servers',
      tags: ['mcp'],
      summary: 'List MCP servers',
    })
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({ mcp: ['read'] })

      const mcpServers = await db
        .select()
        .from(Mcp)
        .where(eq(Mcp.accountId, context.auth.accountId))
        .orderBy(desc(Mcp.createdAt))

      return {
        mcpServers,
      }
    }),

  /**
   * Get a single MCP server by ID.
   * Only accessible by authenticated users with read permission.
   * @returns MCP server details
   */
  get: protectedProcedure
    .route({
      method: 'GET',
      path: '/mcp-servers/{id}',
      tags: ['mcp'],
      summary: 'Get MCP server by ID',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ mcp: ['read'] })

      const [mcpServer] = await db
        .select()
        .from(Mcp)
        .where(and(eq(Mcp.id, input.id), eq(Mcp.accountId, context.auth.accountId)))
        .limit(1)

      if (!mcpServer) {
        throw new ORPCError('NOT_FOUND', {
          message: 'MCP server not found',
        })
      }

      return {
        mcpServer,
      }
    }),

  /**
   * Create a new MCP server.
   * Only accessible by authenticated users with write permission.
   * Validates that tools belong to the specified toolkits.
   * @returns Created MCP server
   */
  create: protectedProcedure
    .route({
      method: 'POST',
      path: '/mcp-servers',
      tags: ['mcp'],
      summary: 'Create MCP server',
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        configuration: McpConfigurationSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ mcp: ['write'] })

      // Validate configuration
      await validateConfiguration(input.configuration.toolkits, input.configuration.tools)

      const [mcpServer] = await db
        .insert(Mcp)
        .values({
          accountId: context.auth.accountId,
          name: input.name,
          configuration: input.configuration,
        })
        .returning()

      return {
        mcpServer,
      }
    }),

  /**
   * Update an existing MCP server.
   * Only accessible by authenticated users with write permission.
   * Validates that tools belong to the specified toolkits.
   * @returns Updated MCP server
   */
  update: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/mcp-servers/{id}',
      tags: ['mcp'],
      summary: 'Update MCP server',
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        configuration: McpConfigurationSchema.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ mcp: ['write'] })

      // Check if MCP server exists and belongs to the account
      const [existingMcpServer] = await db
        .select()
        .from(Mcp)
        .where(and(eq(Mcp.id, input.id), eq(Mcp.accountId, context.auth.accountId)))
        .limit(1)

      if (!existingMcpServer) {
        throw new ORPCError('NOT_FOUND', {
          message: 'MCP server not found',
        })
      }

      // If configuration is being updated, validate it
      if (input.configuration) {
        await validateConfiguration(input.configuration.toolkits, input.configuration.tools)
      }

      // Build update object with only provided fields
      const updateData: {
        name?: string
        configuration?: z.infer<typeof McpConfigurationSchema>
      } = {}

      if (input.name !== undefined) {
        updateData.name = input.name
      }

      if (input.configuration !== undefined) {
        updateData.configuration = input.configuration
      }

      const [mcpServer] = await db
        .update(Mcp)
        .set(updateData)
        .where(and(eq(Mcp.id, input.id), eq(Mcp.accountId, context.auth.accountId)))
        .returning()

      return {
        mcpServer,
      }
    }),

  /**
   * Delete an MCP server.
   * Only accessible by authenticated users with write permission.
   */
  delete: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/mcp-servers/{id}',
      tags: ['mcp'],
      summary: 'Delete MCP server',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ mcp: ['write'] })

      // Check if MCP server exists and belongs to the account
      const [existingMcpServer] = await db
        .select()
        .from(Mcp)
        .where(and(eq(Mcp.id, input.id), eq(Mcp.accountId, context.auth.accountId)))
        .limit(1)

      if (!existingMcpServer) {
        throw new ORPCError('NOT_FOUND', {
          message: 'MCP server not found',
        })
      }

      await db
        .delete(Mcp)
        .where(and(eq(Mcp.id, input.id), eq(Mcp.accountId, context.auth.accountId)))

      return {
        mcpServer: existingMcpServer,
      }
    }),
}
