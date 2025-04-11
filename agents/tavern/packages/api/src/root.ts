import { settingsRouter } from './router/settings'
import { userRouter } from './router/user'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  user: userRouter,
  settings: settingsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
