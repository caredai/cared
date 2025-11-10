import * as crypto from 'node:crypto'
import type { Role, Statements } from 'better-auth/plugins/access'

import type { PermissionGroup, PermissionGroupScope, TokenPolicy } from '@cared/shared'

import type { StatementsSubset } from './statement'
import { accountRoles } from './account'

function md5(data: string) {
  return crypto.createHash('md5').update(data).digest('hex')
}

function generateId(name: string, action: string, type?: 'user' | 'ai') {
  return md5(!type ? `${name}:${action}` : `${name}:${action}:${type}`)
}

export const PERMISSION_GROUPS: (PermissionGroup & {
  statements: StatementsSubset // actually one name and one action
})[] = [
  // apiToken
  {
    id: generateId('apiToken', 'read'),
    name: 'Account API Token Read',
    description: 'Grants access to read account API tokens',
    scopes: ['dev.cared.api.account'],
    statements: {
      apiToken: ['read'],
    },
  },
  {
    id: generateId('apiToken', 'write'),
    name: 'Account API Token Write',
    description: 'Grants access to write account API tokens',
    scopes: ['dev.cared.api.account'],
    statements: {
      apiToken: ['write'],
    },
  },
  {
    id: generateId('userApiToken', 'read'),
    name: 'User API Token Read',
    description: 'Grants access to read user API tokens',
    scopes: ['dev.cared.api.user'],
    statements: {
      userApiToken: ['read'],
    },
  },
  {
    id: generateId('userApiToken', 'write'),
    name: 'User API Token Write',
    description: 'Grants access to write user API tokens',
    scopes: ['dev.cared.api.user'],
    statements: {
      userApiToken: ['write'],
    },
  },
  // credits
  {
    id: generateId('credits', 'read'),
    name: 'Credits Read',
    description: 'Grants access to read credits',
    scopes: ['dev.cared.api.account'],
    statements: {
      credits: ['read'],
    },
  },
  {
    id: generateId('credits', 'write'),
    name: 'Credits Write',
    description: 'Grants access to write credits',
    scopes: ['dev.cared.api.account'],
    statements: {
      credits: ['write'],
    },
  },
  // providerKey
  {
    id: generateId('providerKey', 'read'),
    name: 'Provider Key Read',
    description: 'Grants access to read providerKey',
    scopes: ['dev.cared.api.account'],
    statements: {
      providerKey: ['read'],
    },
  },
  {
    id: generateId('providerKey', 'write'),
    name: 'Provider Key Write',
    description: 'Grants access to write providerKey',
    scopes: ['dev.cared.api.account'],
    statements: {
      providerKey: ['write'],
    },
  },
  // model
  {
    id: generateId('model', 'read'),
    name: 'Model Read',
    description: 'Grants access to read models',
    scopes: ['dev.cared.api.account'],
    statements: {
      model: ['read'],
    },
  },
  {
    id: generateId('model', 'write'),
    name: 'Model Write',
    description: 'Grants access to write models',
    scopes: ['dev.cared.api.account'],
    statements: {
      model: ['write'],
    },
  },
  {
    id: generateId('model', 'invoke'),
    name: 'Model Invoke',
    description: 'Grants access to invoke models',
    scopes: ['dev.cared.api.account'],
    statements: {
      model: ['invoke'],
    },
  },
  {
    id: generateId('model', 'read', 'ai'),
    name: 'Model Read',
    description: 'Grants access to read models',
    scopes: ['dev.cared.api.ai'],
    statements: {
      model: ['read'],
    },
  },
  {
    id: generateId('model', 'write', 'ai'),
    name: 'Model Write',
    description: 'Grants access to write models',
    scopes: ['dev.cared.api.ai'],
    statements: {
      model: ['write'],
    },
  },
  {
    id: generateId('model', 'invoke', 'ai'),
    name: 'Model Invoke',
    description: 'Grants access to invoke models',
    scopes: ['dev.cared.api.ai'],
    statements: {
      model: ['invoke'],
    },
  },
  // app
  {
    id: generateId('app', 'read'),
    name: 'App Read',
    description: 'Grants access to read app',
    scopes: ['dev.cared.api.account'],
    statements: {
      app: ['read'],
    },
  },
  {
    id: generateId('app', 'write'),
    name: 'App Write',
    description: 'Grants access to write app',
    scopes: ['dev.cared.api.account'],
    statements: {
      app: ['write'],
    },
  },
  {
    id: generateId('app', 'publish'),
    name: 'App Publish',
    description: 'Grants access to publish app',
    scopes: ['dev.cared.api.account'],
    statements: {
      app: ['publish'],
    },
  },
  // dataset
  {
    id: generateId('dataset', 'read'),
    name: 'Dataset Read',
    description: 'Grants access to read dataset',
    scopes: ['dev.cared.api.account'],
    statements: {
      dataset: ['read'],
    },
  },
  {
    id: generateId('dataset', 'write'),
    name: 'Dataset Write',
    description: 'Grants access to write dataset',
    scopes: ['dev.cared.api.account'],
    statements: {
      dataset: ['write'],
    },
  },
]

export const PERMISSION_GROUPS_MAP = new Map(PERMISSION_GROUPS.map((p) => [p.id, p]))

export function checkTokenPolicies<TStatements extends Statements>({
  permissions = { pseudo: [] },
  policies,
  accountId,
  userId,
  role, // only for user scope
}: {
  permissions?: StatementsSubset
  policies: TokenPolicy[]
  accountId?: string
  userId?: string
  role?: Role<TStatements> | string
}): boolean {
  function checkPermission(checkName: string, checkAction: string) {
    const checkPolicy = (policy: TokenPolicy): boolean => {
      const matchResource = (pgScope: PermissionGroupScope) => {
        const policyResources = Object.keys(policy.resources)
        if (policyResources.length === 0) {
          return false
        }

        for (const resource of policyResources) {
          const parts = resource.substring('dev.cared.api.'.length).split('.')
          if (parts.length < 2) {
            continue
          }

          const resourceType = parts[0]
          if (resourceType === 'account' && pgScope === 'dev.cared.api.account') {
            if (parts[1] === '*') {
              return true
            }
            if (parts[1] === accountId) {
              return true
            }
          } else if (resourceType === 'user' && pgScope === 'dev.cared.api.user') {
            if (parts[1] === userId) {
              return true
            }
          } else if (resourceType === 'ai' && pgScope === 'dev.cared.api.ai') {
            if (parts[1] === accountId && parts[2] === userId) {
              return true
            }
          }
        }

        return false
      }

      for (const { id } of policy.permissionGroups) {
        const permissionGroup = PERMISSION_GROUPS_MAP.get(id)
        if (!permissionGroup) {
          continue
        }

        const matched = permissionGroup.statements[
          checkName as keyof typeof permissionGroup.statements
        ]?.includes(checkAction as never)
        if (!matched) {
          continue
        }

        const permissionGroupScope = permissionGroup.scopes[0]!

        // Check role statements.
        // For user scope: the permissions granted by an API token's policies
        // must not exceed those granted by the user's role.
        if (
          (permissionGroupScope === 'dev.cared.api.account' ||
            permissionGroupScope === 'dev.cared.api.ai') &&
          role
        ) {
          const roleInstance =
            typeof role === 'string' ? accountRoles[role as keyof typeof accountRoles] : role
          const actionsFromRole =
            roleInstance.statements[checkName as keyof (typeof roleInstance)['statements']]
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!actionsFromRole || !actionsFromRole.includes(checkAction as any)) {
            continue
          }
        }

        if (matchResource(permissionGroupScope)) {
          return true
        }
      }

      return false
    }

    const denyPolicies = policies.filter((p) => p.effect === 'deny')
    const allowPolicies = policies.filter((p) => p.effect === 'allow')

    for (const policy of denyPolicies) {
      if (checkPolicy(policy)) {
        return false // Explicit DENY
      }
    }

    for (const policy of allowPolicies) {
      if (checkPolicy(policy)) {
        return true // Explicit ALLOW
      }
    }

    return false // Implicit DENY ALL
  }

  for (const [name, actions] of Object.entries(permissions)) {
    if (name === 'pseudo') {
      continue
    }
    for (const action of actions) {
      if (!checkPermission(name, action)) {
        return false
      }
    }
  }

  return true
}
