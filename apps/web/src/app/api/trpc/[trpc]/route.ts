import type { NextRequest } from 'next/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter, createTRPCContext } from '@ownxai/api'

/**
 * Configure CORS headers
 * You should extend this to match your needs
 */
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

const handler = async (req: NextRequest) => {
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error)
    },
  })

  setCorsHeaders(response)
  return response
}

export { handler as GET, handler as POST }
