import 'server-only'

import type { RouterClient } from '@orpc/server'
import { createRouterClient } from '@orpc/server'
import { cache } from 'react'
import { headers } from 'next/headers'

import type { AppRouter } from '@cared/api'
import { appRouter, createORPCContext } from '@cared/api'

/**
 * This wraps the `createORPCContext` helper and provides the required context for the oRPC API when
 * handling a oRPC call from a React Server Component.
 */
export const createContext = cache(async () => {
  const heads = new Headers(await headers())
  heads.set('x-orpc-source', 'rsc')

  return await createORPCContext({
    headers: heads,
  })
})

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace globalThis {
  let $orpc: RouterClient<AppRouter> | undefined
}

globalThis.$orpc = createRouterClient(appRouter, {
  context: createContext,
})
