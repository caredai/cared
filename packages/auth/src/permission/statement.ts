import type { Statements } from 'better-auth/plugins/access'

export type ExtractStatementsSubset<TStatements extends Statements> = {
  [P in keyof TStatements]?: TStatements[P][number][]
}

export type StatementsSubset = ExtractStatementsSubset<typeof statements>

export const statements = {
  pseudo: [],

  // Account
  account: ['read', 'write'],
  member: ['read', 'write'],
  invitation: ['read', 'write'],
  apiToken: ['read', 'write'],
  credits: ['read', 'write'],
  subscription: ['read', 'write'],
  invoice: ['read', 'write'],
  providerKey: ['read', 'write'],
  model: ['read', 'write', 'invoke'],
  toolkit: ['read', 'write', 'invoke'],
  mcp: ['read', 'write', 'invoke'],
  app: ['read', 'write', 'publish'],
  dataset: ['read', 'write'],

  // User
  userApiToken: ['read', 'write'],
}
