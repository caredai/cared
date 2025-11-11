import { accountRouter } from './account'
import { adminRouter } from './admin'
import { userRouter } from './user'

export * from './account/model'

export const appRouter = {
  account: accountRouter,
  user: userRouter,
  admin: adminRouter,
}

export type AppRouter = typeof appRouter
