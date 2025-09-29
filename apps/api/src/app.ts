import { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from '@orpc/json-schema'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { RPCHandler } from '@orpc/server/fetch'
import { BatchHandlerPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { appRouter, createORPCContext, model, tasks, webhooks } from '@cared/api'
import { auth } from '@cared/auth'
import { getWebUrl } from '@cared/auth/client'
import { setDb } from '@cared/db/client'

import type { Hyperdrive } from '@cloudflare/workers-types'
import { checkRestrictedColo, checkRestrictedColoHandler, innerCheckPath } from './colo'

export interface Bindings {
  HYPERDRIVE: Hyperdrive
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())
app.use(
  '/*',
  cors({
    origin: getWebUrl(),
    allowMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PATCH', 'DELETE'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-orpc-batch',
      'x-orpc-source',
    ],
    maxAge: 3600,
    credentials: true,
  }),
)

app.use(async (c, next) => {
  if (new URL(c.req.url).pathname !== innerCheckPath) {
    await checkRestrictedColo()
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (c.env.HYPERDRIVE) {
    setDb(c.env.HYPERDRIVE)
  }

  await next()
})

app.get(innerCheckPath, (c) => c.json(checkRestrictedColoHandler(c.req.raw.headers)))

app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

app.get('/api/v1/model/language', model.ai.language.GET)
app.post('/api/v1/model/language', model.ai.language.POST)
app.get('/api/v1/model/image', model.ai.image.GET)
app.post('/api/v1/model/image', model.ai.image.POST)
app.get('/api/v1/model/speech', model.ai.speech.GET)
app.post('/api/v1/model/speech', model.ai.speech.POST)
app.get('/api/v1/model/transcription', model.ai.transcription.GET)
app.post('/api/v1/model/transcription', model.ai.transcription.POST)
app.get('/api/v1/model/embedding', model.ai.embedding.GET)
app.post('/api/v1/model/embedding', model.ai.embedding.POST)

app.post('/api/openai/v1/chat/completions', model.openai.chatCompletions.POST)
app.post('/api/v1/openai/chat/completions', model.openai.chatCompletions.POST)

app.post('/api/v1/webhooks/tasks/:task', tasks.POST)

app.post('/api/v1/webhooks/credits', webhooks.credits.POST)

export const rpcHandler = new RPCHandler(appRouter, {
  strictGetMethodPluginEnabled: false, // Replace Strict Get Method Plugin
  plugins: [
    new BatchHandlerPlugin(),
    new ResponseHeadersPlugin(),
  ],
  interceptors: [
    // eslint-disable-next-line @typescript-eslint/unbound-method
    async ({ next }) => {
      try {
        return await next()
      } catch (error) {
        console.error(error)
        throw error
      }
    },
  ],
})

export const openApiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new SmartCoercionPlugin({
      schemaConverters: [
        new ZodToJsonSchemaConverter(),
      ],
    }),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new BatchHandlerPlugin(),
    new ResponseHeadersPlugin(),
  ],
  interceptors: [
    // eslint-disable-next-line @typescript-eslint/unbound-method
    async ({ next }) => {
      try {
        return await next()
      } catch (error) {
        console.error(error)
        throw error
      }
    },
  ],
})

app.use('/api/*', async (c, next) => {
  const context = await createORPCContext({
    headers: c.req.raw.headers,
  })

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: '/api/rpc',
    context: context,
  })

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response)
  }

  const apiResult = await openApiHandler.handle(c.req.raw, {
    prefix: '/api/openapi',
    context: context,
  })

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response)
  }

  await next()
})

export default app
