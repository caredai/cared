import { appRouter as app } from './router/app'
import { appCategoryRouter } from './router/appCategory'
import { chatRouter, messageRouter } from './router/chat'
import { postRouter } from './router/post'
import { workspaceRouter } from './router/workspace'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  app,
  appCategory: appCategoryRouter,
  chat: chatRouter,
  message: messageRouter,
  post: postRouter,
  workspace: workspaceRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
