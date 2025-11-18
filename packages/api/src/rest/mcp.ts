import type { Context } from 'hono'
import { jsonSchemaToZod } from '@composio/json-schema-to-zod'
import { StreamableHTTPTransport } from '@hono/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { and, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Mcp } from '@cared/db/schema'
import { getComposio } from '@cared/tools'

import { ProtectedAuth } from '../auth'

async function handler(c: Context): Promise<Response | undefined> {
  const serverId = 'mcp_' + c.req.param('serverId')
  const auth = await ProtectedAuth.authenticate(c.req.raw.headers)
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }

  const connectionsParam = c.req.query('connections')
  const connectionIds = connectionsParam ? connectionsParam.split(',').filter(Boolean) : []

  const mcp = await db.query.Mcp.findFirst({
    where: and(eq(Mcp.id, serverId), eq(Mcp.accountId, auth.accountId)),
  })
  if (!mcp) {
    return new Response('Internal Server Error', { status: 500 })
  }

  await auth.requirePermissions({
    mcp: ['invoke'],
  })

  const resolvedUserId = auth.userId ?? auth.accountId

  // Validate connections and build toolkit to connection mapping
  const toolkitToConnectionMap = await validateAndMapConnections(resolvedUserId, connectionIds)

  const mcpServer = new McpServer(
    {
      name: mcp.name,
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  // Register tools from configuration
  await registerTools(mcpServer, mcp.configuration, resolvedUserId, toolkitToConnectionMap)

  const transport = new StreamableHTTPTransport()
  await mcpServer.connect(transport)
  return transport.handleRequest(c)
}

/**
 * Validate connections and build toolkit to connection ID mapping
 * @param userId - The user ID to verify connection ownership
 * @param connectionIds - Array of connection IDs to validate
 * @returns Map from toolkit slug to connection ID
 * @throws Response if any connection is invalid or doesn't belong to the user
 */
async function validateAndMapConnections(
  userId: string,
  connectionIds: string[],
): Promise<Map<string, string>> {
  const toolkitToConnectionMap = new Map<string, string>()

  // If no connections specified, return empty map
  if (connectionIds.length === 0) {
    return toolkitToConnectionMap
  }

  const composio = getComposio()

  // Query all specified connections
  const { items: connections } = await composio.getClient().connectedAccounts.list({
    user_ids: [userId],
    connected_account_ids: connectionIds,
  })

  // Verify all requested connections exist and belong to the user
  const foundConnectionIds = new Set(connections.map((conn) => conn.id))
  const missingConnectionIds = connectionIds.filter((id) => !foundConnectionIds.has(id))

  if (missingConnectionIds.length > 0) {
    throw new Error(
      `Invalid connections: The following connections were not found or do not belong to you: ${missingConnectionIds.join(', ')}`,
    )
  }

  // Build toolkit to connection mapping
  // If multiple connections exist for the same toolkit, the last one wins
  for (const connection of connections) {
    toolkitToConnectionMap.set(connection.toolkit.slug, connection.id)
  }

  return toolkitToConnectionMap
}

/**
 * Register tools to MCP server based on configuration
 * @param mcpServer - The MCP server instance
 * @param mcpConfiguration - MCP configuration containing toolkits and tools
 * @param resolvedUserId - The resolved user ID for tool execution
 * @param toolkitToConnectionMap - Map from toolkit slug to connection ID
 */
async function registerTools(
  mcpServer: McpServer,
  mcpConfiguration: { toolkits?: string[]; tools?: string[] },
  resolvedUserId: string,
  toolkitToConnectionMap: Map<string, string>,
): Promise<void> {
  const { toolkits, tools } = mcpConfiguration

  // If no toolkits specified, no tools to register
  if (!toolkits || toolkits.length === 0) {
    return
  }

  // Get all tools from Composio
  const composio = getComposio()
  const allTools = await composio.tools.getRawComposioTools({
    toolkits,
    limit: 9999,
  })

  // Filter tools if specific tools are requested
  const toolsToRegister =
    tools && tools.length > 0 ? allTools.filter((tool) => tools.includes(tool.slug)) : allTools

  // Register each tool to the MCP server
  for (const tool of toolsToRegister) {
    // Get the connection ID for this tool's toolkit, if available
    const toolkitSlug = tool.toolkit?.slug
    const connectionId = toolkitSlug ? toolkitToConnectionMap.get(toolkitSlug) : undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mcpServer.registerTool<any, any>(
      tool.slug,
      {
        title: tool.name,
        description: tool.description,
        inputSchema: tool.inputParameters ? jsonSchemaToZod(tool.inputParameters) : undefined,
        outputSchema: tool.outputParameters ? jsonSchemaToZod(tool.outputParameters) : undefined,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (input: any) => {
        const result = await composio.tools.execute(tool.slug, {
          userId: resolvedUserId,
          connectedAccountId: connectionId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          arguments: input,
          dangerouslySkipVersionCheck: true,
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result),
            },
          ],
          structuredContent: result,
        }
      },
    )
  }
}

export { handler as HANDLER }
