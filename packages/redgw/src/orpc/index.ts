import { graphRouter } from './graph.js'

export * from './orpc.js'

export const appRouter = {
  graph: graphRouter,
}

export type AppRouter = typeof appRouter
