import { accountRouter as accountRouter_ } from './account'
import { agentRouter } from './agent'
import { apiTokenRouter } from './api-token'
import { appRouter } from './app'
import { creditsRouter } from './credits'
import { datasetRouter } from './dataset'
import { expenseRouter } from './expense'
import { fileRouter } from './file'
import { mcpRouter } from './mcp'
import { modelRouter } from './model'
import { oauthAppRouter } from './oauth-app'
import { providerKeyRouter } from './provider-key'
import { storageRouter } from './storage'
import { stripeRouter } from './stripe'
import { telemetryRouter } from './telemetry'
import { toolRouter } from './tool'
import { userRouter } from './user'
import { vectorRouter } from './vector'

export const accountRouter = {
  account: accountRouter_,
  user: userRouter,
  app: appRouter,
  apiToken: apiTokenRouter,
  oauthApp: oauthAppRouter,
  providerKey: providerKeyRouter,
  agent: agentRouter,
  dataset: datasetRouter,
  storage: storageRouter,
  model: modelRouter,
  credits: creditsRouter,
  expense: expenseRouter,
  stripe: stripeRouter,
  telemetry: telemetryRouter,
  file: fileRouter,
  tool: toolRouter,
  mcp: mcpRouter,
  vector: vectorRouter,
}
