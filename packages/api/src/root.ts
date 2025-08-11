import { createTRPCRouter } from './trpc'
import { adminRouter } from './trpc/admin'
import { agentRouter } from './trpc/agent'
import { apiKeyRouter } from './trpc/api-key'
import { appRouter as _appRouter } from './trpc/app'
import { artifactRouter } from './trpc/artifact'
import { chatRouter } from './trpc/chat'
import { creditsRouter } from './trpc/credits'
import { datasetRouter } from './trpc/dataset'
import { messageRouter } from './trpc/message'
import { modelRouter } from './trpc/model'
import { oauthAppRouter } from './trpc/oauth-app'
import { organizationRouter } from './trpc/organization'
import { providerKeyRouter } from './trpc/provider-key'
import { storageRouter } from './trpc/storage'
import { tokenizerRouter } from './trpc/tokenizer'
import { userRouter } from './trpc/user'
import { workspaceRouter } from './trpc/workspace'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  organization: organizationRouter,
  workspace: workspaceRouter,
  user: userRouter,
  providerKey: providerKeyRouter,
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
  credits: creditsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
