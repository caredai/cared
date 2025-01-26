import type * as trpcNext from '@trpc/server/adapters/next'
import { headers } from 'next/headers'
import { auth, getAuth } from '@clerk/nextjs/server'
import * as trpc from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'

import type { DB } from '@mindworld/db/client'
import { db } from '@mindworld/db/client'

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the auth, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createContext = (
  opts: trpcNext.CreateNextContextOptions,
): { auth: ReturnType<typeof getAuth>; db: DB } => {
  const auth = getAuth(opts.req)

  const source = opts.req.headers['x-trpc-source'] ?? 'unknown'
  console.log('>>> tRPC Request from', source, 'by', auth.userId)

  return {
    auth,
    db,
  }
}

/**
 * This section defines the "contexts" that are available when
 * handling a tRPC call from a React Server Component.
 */
export const createContextForRsc = async (): Promise<{
  auth: Awaited<ReturnType<typeof auth>>
  db: DB
}> => {
  const _auth = await auth()

  const heads = new Headers(await headers())
  heads.set('x-trpc-source', 'rsc')

  console.log('>>> tRPC Request from', heads.get('x-trpc-source') ?? 'unknown', 'by', _auth.userId)

  return {
    auth: _auth,
    db,
  }
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = trpc.initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
})

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  const result = await next()

  const end = Date.now()
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`)

  return result
})

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user auth data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware)

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to authenticated users, use this.
 * It verifies the auth is valid.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new trpc.TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      auth: ctx.auth,
    },
  })
})
