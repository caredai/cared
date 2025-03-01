import { adminRouter } from './router/admin'
import { agentRouter } from './router/agent'
import { apiKeyRouter } from './router/api-key'
import { appRouter as _appRouter } from './router/app'
import { artifactRouter } from './router/artifact'
import { chatRouter } from './router/chat'
import { datasetRouter } from './router/dataset'
import { modelRouter } from './router/model'
import { oauthAppRouter } from './router/oauth-app'
import { userRouter } from './router/user'
import { workspaceRouter } from './router/workspace'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  workspace: workspaceRouter,
  user: userRouter,
  app: _appRouter,
  apiKey: apiKeyRouter,
  oauthApp: oauthAppRouter,
  agent: agentRouter,
  dataset: datasetRouter,
  model: modelRouter,
  chat: chatRouter,
  artifact: artifactRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
