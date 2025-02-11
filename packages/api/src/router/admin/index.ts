import { createTRPCRouter } from '../../trpc'
import { userRouter } from './user'
import { workspaceRouter } from './workspace'

export const adminRouter = createTRPCRouter({
  ...userRouter,
  ...workspaceRouter,
})
