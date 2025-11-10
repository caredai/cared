import type { organization } from 'better-auth/plugins'
import { clientSideHasPermission } from 'better-auth/client/plugins'
import { createAccessControl } from 'better-auth/plugins/access'

import type { StatementsSubset } from './statement'
import { auth } from '../server'
import { statements } from './statement'

export const accountAc = createAccessControl(statements)

const ownerAc = accountAc.newRole({
  pseudo: [],
  account: ['read', 'write'],
  member: ['read', 'write'],
  invitation: ['read', 'write'],
  apiToken: ['read', 'write'],
  credits: ['read', 'write'],
  providerKey: ['read', 'write'],
  model: ['read', 'write', 'invoke'],
  app: ['read', 'write', 'publish'],
  dataset: ['read', 'write'],

  userApiToken: ['read', 'write'],
})

const adminAc = accountAc.newRole({
  pseudo: [],
  account: ['read', 'write'],
  member: ['read', 'write'],
  invitation: ['read', 'write'],
  apiToken: ['read', 'write'],
  credits: ['read', 'write'],
  providerKey: ['read', 'write'],
  model: ['read', 'write', 'invoke'],
  app: ['read', 'write', 'publish'],
  dataset: ['read', 'write'],

  userApiToken: ['read', 'write'],
})

const memberAc = accountAc.newRole({
  pseudo: [],
  account: ['read'],
  member: ['read'],
  invitation: ['read'],
  apiToken: ['read'],
  credits: ['read'],
  providerKey: ['read'],
  model: ['read', 'invoke'],
  app: ['read'],
  dataset: ['read'],

  userApiToken: ['read'],
})

export const accountRoles = {
  owner: ownerAc,
  admin: adminAc,
  member: memberAc,
}

export type AccountRole = 'owner' | 'admin' | 'member'

export function checkPermissionsByRole(
  role: AccountRole,
  permissions: StatementsSubset = { pseudo: [] },
) {
  const orgPlugin = auth.options.plugins.find(
    (plugin) => plugin.id === 'organization',
  ) as ReturnType<typeof organization>

  return clientSideHasPermission({
    role,
    options: orgPlugin.options,
    permissions,
  })
}
