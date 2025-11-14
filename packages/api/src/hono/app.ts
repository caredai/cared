import * as console from 'node:console'
import { otel } from '@hono/otel'
import { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from '@orpc/json-schema'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { RPCHandler } from '@orpc/server/fetch'
import { BatchHandlerPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { auth } from '@cared/auth'
import { getApiPath, getTrustedOrigins } from '@cared/auth/client'
import { setDb } from '@cared/db/client'

import type { Hyperdrive } from '@cloudflare/workers-types'
import { appRouter, createORPCContext } from '..'
import { Cache } from '../operation/cache'
import { model, tasks, toolkits, webhooks } from '../rest'
import { registerTelemetry } from '../telemetry'

export interface Bindings {
  CLOUDFLARE?: boolean
  HYPERDRIVE?: Hyperdrive
}

export type HonoApp = Hono<{ Bindings?: Bindings }>

export function newHonoApp({ cacheMaxSize }: { cacheMaxSize?: number }): HonoApp {
  Cache.setup(cacheMaxSize)

  registerTelemetry()

  const app = new Hono<{ Bindings?: Bindings }>()

  const trustedOrigins = getTrustedOrigins()

  app.use(logger(), otel())
  app.use(
    '/*',
    cors({
      origin: (origin: string) => {
        return trustedOrigins.includes(origin) ? origin : undefined
        // return '*' // TODO
      },
      allowMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PATCH', 'PUT', 'DELETE'],
      allowHeaders: [
        '*', // TODO
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
    if (c.env?.HYPERDRIVE) {
      setDb(c.env.HYPERDRIVE)
    }

    await next()
  })

  app.on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))

  app.get('/v1/model/language', model.ai.language.GET)
  app.post('/v1/model/language', model.ai.language.POST)
  app.get('/v1/model/image', model.ai.image.GET)
  app.post('/v1/model/image', model.ai.image.POST)
  app.get('/v1/model/speech', model.ai.speech.GET)
  app.post('/v1/model/speech', model.ai.speech.POST)
  app.get('/v1/model/transcription', model.ai.transcription.GET)
  app.post('/v1/model/transcription', model.ai.transcription.POST)
  app.get('/v1/model/embedding', model.ai.embedding.GET)
  app.post('/v1/model/embedding', model.ai.embedding.POST)

  app.post('/v1/openai/chat/completions', model.openai.chatCompletions.POST)
  app.post('/openai/v1/chat/completions', model.openai.chatCompletions.POST)

  app.post('/openrouter/v1/chat/completions', model.openai.chatCompletions.POST)
  app.get('/openrouter/v1/credits', model.openrouter.credits.GET)
  app.get('/openrouter/v1/key', model.openrouter.key.GET)
  app.get('/openrouter/v1/auth/key', model.openrouter.key.GET)

  app.post('/v1/webhooks/tasks/:task', tasks.POST)

  app.post('/v1/webhooks/credits', webhooks.credits.POST)

  app.post('/v1/toolkits/callback/composio', toolkits.composio.GET)

  const rpcHandler = new RPCHandler(appRouter, {
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

  const openApiHandler = new OpenAPIHandler(appRouter, {
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

  app.use('/*', async (c, next) => {
    const context = await createORPCContext({
      headers: c.req.raw.headers,
    })

    const rpcResult = await rpcHandler.handle(c.req.raw, {
      prefix: `${getApiPath()}/rpc`,
      context: context,
    })

    if (rpcResult.matched) {
      return c.newResponse(rpcResult.response.body, rpcResult.response)
    }

    const apiResult = await openApiHandler.handle(c.req.raw, {
      prefix: `${getApiPath()}/openapi`,
      context: context,
    })

    if (apiResult.matched) {
      return c.newResponse(apiResult.response.body, apiResult.response)
    }

    await next()
  })

  if (!getApiPath()) {
    return app
  }

  const wrappedApp = new Hono<{ Bindings?: Bindings }>()
  wrappedApp.route(getApiPath(), app)

  return wrappedApp
}
