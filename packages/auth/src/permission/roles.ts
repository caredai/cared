import { createAccessControl } from 'better-auth/plugins/access'

import { statements } from './statement'

export const accountAc = createAccessControl(statements)

const ownerAc = accountAc.newRole({
  pseudo: [],
  account: ['read', 'write'],
  member: ['read', 'write'],
  invitation: ['read', 'write'],
  apiToken: ['read', 'write'],
  oauthApp: ['read', 'write'],
  credits: ['read', 'write'],
  subscription: ['read', 'write'],
  invoice: ['read', 'write'],
  providerKey: ['read', 'write'],
  model: ['read', 'write', 'invoke'],
  toolkit: ['read', 'write', 'invoke'],
  mcp: ['read', 'write', 'invoke'],
  dataset: ['read', 'write'],
})

const adminAc = accountAc.newRole({
  pseudo: [],
  account: ['read', 'write'],
  member: ['read', 'write'],
  invitation: ['read', 'write'],
  apiToken: ['read', 'write'],
  oauthApp: ['read', 'write'],
  credits: ['read', 'write'],
  subscription: ['read', 'write'],
  invoice: ['read', 'write'],
  providerKey: ['read', 'write'],
  model: ['read', 'write', 'invoke'],
  toolkit: ['read', 'write', 'invoke'],
  mcp: ['read', 'write', 'invoke'],
  dataset: ['read', 'write'],
})

const memberAc = accountAc.newRole({
  pseudo: [],
  account: ['read'],
  member: ['read'],
  invitation: ['read'],
  apiToken: ['read'],
  oauthApp: ['read'],
  credits: ['read'],
  subscription: ['read'],
  invoice: ['read'],
  providerKey: ['read'],
  model: ['read', 'invoke'],
  toolkit: ['read', 'invoke'],
  mcp: ['read', 'invoke'],
  dataset: ['read'],
})

export const accountRoles = {
  owner: ownerAc,
  admin: adminAc,
  member: memberAc,
}

export type AccountRole = 'owner' | 'admin' | 'member'
