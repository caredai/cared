import { serve } from '@hono/node-server'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { BatchHandlerPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins'
import { Hono } from 'hono'

import type { HttpBindings } from '@hono/node-server'
import { env } from './env.js'
import { runOffloader } from './offloader/index.js'
import { appRouter, createORPCContext } from './orpc/index.js'

/**
 * Starts the Hono HTTP server
 */
function startServer(): void {
  const app = new Hono<{ Bindings: HttpBindings }>()

  app.get('/', (c) => {
    return c.text('ok')
  })

  const handler = new RPCHandler(appRouter, {
    strictGetMethodPluginEnabled: false, // Replace Strict Get Method Plugin
    plugins: [
      new BatchHandlerPlugin(),
      new ResponseHeadersPlugin(),
    ],
    interceptors: [
      onError((error) => {
        console.error(error)
      }),
    ],
  })

  app.use('/rpc/*', async (c, next) => {
    const context = createORPCContext({
      headers: c.req.raw.headers,
    })

    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: '/rpc',
      context,
    })

    if (matched) {
      return c.newResponse(response.body, response)
    }

    await next()
  })

  const server = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`Redgw server is running on port ${info.port}`)
    },
  )

  // Handle server errors
  server.on('error', (err: Error) => {
    console.error('Server error:', err)
    process.exit(1)
  })

  // Graceful shutdown handlers
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down server gracefully...`)
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

/**
 * Starts the graph offloader
 */
async function startOffloader(): Promise<void> {
  // Setup graceful shutdown handlers before starting offloader
  let shutdownRequested = false

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down offloader gracefully...`)
    shutdownRequested = true
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  // Start offloader with shutdown flag
  await runOffloader(() => shutdownRequested)
}

// Parse command line arguments
const args = process.argv.slice(2)
const mode = args.find((arg) => arg === '--server' || arg === '--offloader') ?? '--server'

if (mode === '--offloader') {
  startOffloader().catch((error) => {
    console.error('Failed to start offloader:', error)
    process.exit(1)
  })
} else {
  try {
    startServer()
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
