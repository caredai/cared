import { appRouter } from './app'
import { mockRouter } from './mock'
import { organizationRouter } from './organization'
import { userRouter } from './user'
import { workspaceRouter } from './workspace'

export const adminRouter = {
  ...userRouter,
  ...organizationRouter,
  ...workspaceRouter,
  ...appRouter,
  ...mockRouter,
}
