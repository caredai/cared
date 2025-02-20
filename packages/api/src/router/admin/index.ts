import { appRouter } from './app'
import { userRouter } from './user'
import { workspaceRouter } from './workspace'

export const adminRouter = {
  ...userRouter,
  ...workspaceRouter,
  ...appRouter,
}
