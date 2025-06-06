import { appRouter } from './app'
import { mockRouter } from './mock'
import { userRouter } from './user'
import { workspaceRouter } from './workspace'

export const adminRouter = {
  ...userRouter,
  ...workspaceRouter,
  ...appRouter,
  ...mockRouter,
}
