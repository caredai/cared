import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import { appRouter, createTRPCContext } from '@mindworld/api'

import { setCorsHeaders } from '../trpc/[trpc]/route'

const handler = async (req: Request) => {
  const response = await createOpenApiFetchHandler({
    endpoint: '/api',
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
      }),
    req,
  })

  setCorsHeaders(response)
  return response
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
}
