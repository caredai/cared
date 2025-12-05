import { serve } from '@hono/node-server'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { BatchHandlerPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins'
import { Hono } from 'hono'

import type { HttpBindings } from '@hono/node-server'
import { appRouter, createORPCContext } from './orpc/index.js'

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
    port: 3000,
  },
  (info) => {
    console.log(`Redgw server is running on port ${info.port}`)
  },
)

// graceful shutdown
process.on('SIGINT', () => {
  server.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })
})
