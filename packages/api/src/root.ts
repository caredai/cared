import { adminRouter } from './router/admin'
import { appRouter as _appRouter } from './router/app'
import { chatRouter, messageRouter } from './router/chat'
import { postRouter } from './router/post'
import { userRouter } from './router/user'
import { workspaceRouter } from './router/workspace'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  app: _appRouter,
  chat: chatRouter,
  message: messageRouter,
  post: postRouter,
  user: userRouter,
  workspace: workspaceRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
