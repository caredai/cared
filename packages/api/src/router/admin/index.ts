import { createTRPCRouter } from '../../trpc'
import { appRouter } from './app'
import { userRouter } from './user'
import { workspaceRouter } from './workspace'

export const adminRouter = createTRPCRouter({
  ...userRouter,
  ...workspaceRouter,
  ...appRouter,
})
