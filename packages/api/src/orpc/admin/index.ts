import { accountRouter } from './account'
import { appRouter } from './app'
import { mockRouter } from './mock'
import { userRouter } from './user'

export const adminRouter = {
  ...userRouter,
  ...accountRouter,
  ...appRouter,
  ...mockRouter,
}
