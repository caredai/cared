import { createTRPCRouter } from './trpc'
import { adminRouter } from './trpc/admin'
import { agentRouter } from './trpc/agent'
import { apiKeyRouter } from './trpc/api-key'
import { appRouter as _appRouter } from './trpc/app'
import { artifactRouter } from './trpc/artifact'
import { chatRouter } from './trpc/chat'
import { datasetRouter } from './trpc/dataset'
import { messageRouter } from './trpc/message'
import { modelRouter } from './trpc/model'
import { oauthAppRouter } from './trpc/oauth-app'
import { secretRouter } from './trpc/secret'
import { storageRouter } from './trpc/storage'
import { tokenizerRouter } from './trpc/tokenizer'
import { userRouter } from './trpc/user'
import { workspaceRouter } from './trpc/workspace'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  workspace: workspaceRouter,
  user: userRouter,
  secret: secretRouter,
  app: _appRouter,
  apiKey: apiKeyRouter,
  oauthApp: oauthAppRouter,
  agent: agentRouter,
  dataset: datasetRouter,
  storage: storageRouter,
  model: modelRouter,
  tokenizer: tokenizerRouter,
  chat: chatRouter,
  message: messageRouter,
  artifact: artifactRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
