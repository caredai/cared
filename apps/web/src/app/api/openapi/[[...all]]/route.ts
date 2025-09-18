import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { ResponseHeadersPlugin } from '@orpc/server/plugins'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'

import { appRouter, createORPCContext } from '@cared/api'

import { setCorsHeaders } from '@/app/api/rpc/[[...all]]/route'

export const OPTIONS = () => {
  const response = new Response(null, {
    status: 204,
  })
  setCorsHeaders(response)
  return response
}

const handler = new OpenAPIHandler(appRouter, {
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
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new ResponseHeadersPlugin(),
  ],
})

async function handleRequest(request: Request) {
  let { response } = await handler.handle(request, {
    prefix: '/api/openapi',
    context: await createORPCContext(request),
  })

  response ??= new Response('Not found', { status: 404 })

  setCorsHeaders(response)

  return response
}

export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
