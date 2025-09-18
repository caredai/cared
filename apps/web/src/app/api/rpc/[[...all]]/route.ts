import { RPCHandler } from '@orpc/server/fetch'
import { ResponseHeadersPlugin } from '@orpc/server/plugins'

import { appRouter, createORPCContext } from '@cared/api'

export const setCorsHeaders = (res: Response) => {
  // We can use the response object to enable CORS
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Request-Method', '*')
  res.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST')
  res.headers.set('Access-Control-Allow-Headers', '*')
  // If you need to make authenticated CORS calls then
  // remove what is above and uncomment the below code
  // Allow-Origin has to be set to the requesting domain that you want to send the credentials back to
  // res.headers.set('Access-Control-Allow-Origin', 'http://example:6006');
  // res.headers.set('Access-Control-Request-Method', '*');
  // res.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET');
  // res.headers.set('Access-Control-Allow-Headers', 'content-type');
  // res.headers.set('Referrer-Policy', 'no-referrer');
  // res.headers.set('Access-Control-Allow-Credentials', 'true');
}

export const OPTIONS = () => {
  const response = new Response(null, {
    status: 204,
  })
  setCorsHeaders(response)
  return response
}

const handler = new RPCHandler(appRouter, {
  plugins: [
    new ResponseHeadersPlugin()
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

async function handleRequest(request: Request) {
  let { response } = await handler.handle(request, {
    prefix: '/api/rpc',
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
