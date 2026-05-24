import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { HttpBindings } from '@hono/node-server'
import { createCaredOrpcClient } from '../cared.js'
import { env } from '../env.js'
import { touchBranchAccess } from '../gateway/access.js'
import { gatewayManager } from '../gateway/manager.js'
import { authorizeBranchAccess } from './auth.js'
import { parseGatewayHost } from './host.js'
import { proxyToGateway } from './proxy.js'

function getHostFromRequest(req: Request) {
  return req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? undefined
}

export function createApp() {
  const app = new Hono<{ Bindings: HttpBindings }>()

  app.get('/health', (c) => c.text('ok'))

  // Browser calls this from the Cared web app (cross-origin, credentials).
  const allowedOrigins = new Set(env.CORS_ALLOWED_ORIGINS)
  app.use(
    '/_cared/sync',
    cors({
      origin: (origin) => (origin && allowedOrigins.has(origin) ? origin : undefined),
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      credentials: true,
      maxAge: 86_400,
    }),
  )

  /**
   * Cared frontend calls this to reconcile Drizzle Gateway DB slots with Neon.
   */
  app.post('/_cared/sync', async (c) => {
    const host = parseGatewayHost(getHostFromRequest(c.req.raw))
    if (!host) {
      return c.json({ error: 'Invalid host' }, 400)
    }

    const headers = new Headers(c.req.raw.headers)
    try {
      await authorizeBranchAccess(host, headers)
    } catch (err: unknown) {
      console.error(err)
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const client = createCaredOrpcClient(headers)
    const result = await gatewayManager.syncGateway(client, host)
    await touchBranchAccess(host.branchKey)

    return c.json(result)
  })

  app.all('*', async (c) => {
    const host = parseGatewayHost(getHostFromRequest(c.req.raw))
    if (!host) {
      return c.text('Invalid host', 400)
    }

    try {
      const response = await proxyToGateway(host, c.req.raw)
      return new Response(response.body, response)
    } catch (error) {
      console.error('Gateway proxy error:', error)
      const message = error instanceof Error ? error.message : 'Gateway error'
      if (message.includes('NOT_FOUND') || message.includes('not found')) {
        return c.text('Not found', 404)
      }
      if (message.includes('Unauthorized') || message.includes('UNAUTHORIZED')) {
        return c.text('Unauthorized', 401)
      }
      return c.text('Bad gateway', 502)
    }
  })

  return app
}

export function startServer(): void {
  const app = createApp()

  const server = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`Drizzgw server is running on port ${info.port}`)
    },
  )

  server.on('error', (err: Error) => {
    console.error('Server error:', err)
    process.exit(1)
  })

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down drizzgw server gracefully...`)
    server.close(() => {
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}
