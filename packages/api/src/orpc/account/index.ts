import { accountRouter as accountRouter_ } from './account'
import { apiTokenRouter } from './api-token'
import { creditsRouter } from './credits'
import { databaseRouter } from './database'
import { datasetRouter } from './dataset'
import { expenseRouter } from './expense'
import { fileRouter } from './file'
import { flowRouter } from './flow'
import { functionRouter } from './function'
// import { graphRouter } from './graph'
import { integrationRouter } from './integration'
import { invoiceRouter } from './invoices'
import { mcpRouter } from './mcp'
import { modelRouter } from './model'
import { oauthAppRouter } from './oauth-app'
import { providerKeyRouter } from './provider-key'
import { sandboxRouter } from './sandbox'
import { siteRouter } from './site'
import { stripeRouter } from './stripe'
import { subscriptionRouter } from './subscriptions'
import { telemetryRouter } from './telemetry'
import { toolRouter } from './tool'
import { userRouter } from './user'
import { vectorRouter } from './vector'

export const accountRouter = {
  account: accountRouter_,
  user: userRouter,
  apiToken: apiTokenRouter,
  oauthApp: oauthAppRouter,
  providerKey: providerKeyRouter,
  dataset: datasetRouter,
  model: modelRouter,
  credits: creditsRouter,
  expense: expenseRouter,
  stripe: stripeRouter,
  subscriptions: subscriptionRouter,
  invoices: invoiceRouter,
  telemetry: telemetryRouter,
  file: fileRouter,
  tool: toolRouter,
  mcp: mcpRouter,
  vector: vectorRouter,
  flow: flowRouter,
  integration: integrationRouter,
  database: databaseRouter,
  sandbox: sandboxRouter,
  function: functionRouter,
  site: siteRouter,
  // graph: graphRouter,
}
