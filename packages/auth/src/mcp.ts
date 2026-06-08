import type { Context, Hono } from 'hono'
import { mcpHandler } from '@better-auth/oauth-provider'
import { StreamableHTTPTransport } from '@hono/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { getApiPath, getApiUrl } from './client'
import { serverClient } from './server-client'

export function setupMcpRoutes(app: Hono, mcpInit?: (mcpServer: McpServer) => void): void {
  const getProtectedResourceMetadata = async (c: Context) => {
    const config = await serverClient.getProtectedResourceMetadata({
      resource: getApiUrl(), // `aud` claim
      authorization_servers: [getApiUrl()],
    })
    return c.json(config)
  }
  app.get('/.well-known/oauth-protected-resource', getProtectedResourceMetadata)
  app.get(`/.well-known/oauth-protected-resource${getApiPath()}/mcp`, getProtectedResourceMetadata)

  const handler = mcpHandler(
    {
      jwksUrl: `${getApiPath()}/auth/jwks`,
      verifyOptions: {
        issuer: getApiUrl(),
        audience: getApiUrl(),
      },
    },
    async (req, jwt): Promise<Response> => {
      const userId = jwt.sub
      if (!userId) {
        throw new Error('Unauthenticated')
      }
      const transport = new StreamableHTTPTransport({
        sessionIdGenerator: () => userId,
      })

      const mcpServer = new McpServer({
        name: 'cared-mcp-server',
        version: '1.0.0',
      })

      mcpInit?.(mcpServer)

      if (!mcpServer.isConnected()) {
        await mcpServer.connect(transport)
      }

      const res = await transport.handleRequest((req as Request & { c: Context }).c)
      if (!res) {
        throw new Error('No response')
      }
      return res
    },
  )

  app.on(['GET', 'POST', 'DELETE'], '/mcp', async (c) => {
    // Inject context
    const req = c.req.raw as Request & {
      c?: Context
    }
    req.c = c
    try {
      return await handler(req)
    } finally {
      delete req.c
    }
  })
}
