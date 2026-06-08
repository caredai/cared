import * as crypto from 'node:crypto'
import type { Role, Statements } from 'better-auth/plugins/access'

import type { ApiTokenCredentialType } from '@cared/db/schema'
import type { PermissionGroup, PermissionGroupScope, TokenPolicy } from '@cared/shared'
import { tokenPolicySchema } from '@cared/shared'

import type { AccountRole } from './account'
import type { StatementsSubset } from './statement'
import { checkPermissionsByRole } from './account'
import { accountRoles } from './roles'

function md5(data: string) {
  return crypto.createHash('md5').update(data).digest('hex')
}

function generateId(name: string, action: string) {
  return md5(`${name}:${action}`)
}

export const PERMISSION_GROUPS: (PermissionGroup & {
  statements: StatementsSubset // actually one name and one action
})[] = [
  // account
  {
    id: generateId('account', 'read'),
    name: 'Account Read',
    description: 'Grants access to read account settings',
    scopes: ['dev.cared.api.account'],
    statements: {
      account: ['read'],
    },
  },
  {
    id: generateId('account', 'write'),
    name: 'Account Write',
    description: 'Grants access to write account settings',
    scopes: ['dev.cared.api.account'],
    statements: {
      account: ['write'],
    },
  },
  // member
  {
    id: generateId('member', 'read'),
    name: 'Member Read',
    description: 'Grants access to read account members',
    scopes: ['dev.cared.api.account'],
    statements: {
      member: ['read'],
    },
  },
  {
    id: generateId('member', 'write'),
    name: 'Member Write',
    description: 'Grants access to write account members',
    scopes: ['dev.cared.api.account'],
    statements: {
      member: ['write'],
    },
  },
  // invitation
  {
    id: generateId('invitation', 'read'),
    name: 'Invitation Read',
    description: 'Grants access to read invitations',
    scopes: ['dev.cared.api.account'],
    statements: {
      invitation: ['read'],
    },
  },
  {
    id: generateId('invitation', 'write'),
    name: 'Invitation Write',
    description: 'Grants access to write invitations',
    scopes: ['dev.cared.api.account'],
    statements: {
      invitation: ['write'],
    },
  },
  // apiToken
  {
    id: generateId('apiToken', 'read'),
    name: 'API Token Read',
    description: 'Grants access to read API tokens',
    scopes: ['dev.cared.api.account', 'dev.cared.api.user'],
    statements: {
      apiToken: ['read'],
    },
  },
  {
    id: generateId('apiToken', 'write'),
    name: 'API Token Write',
    description: 'Grants access to write API tokens',
    scopes: ['dev.cared.api.account', 'dev.cared.api.user'],
    statements: {
      apiToken: ['write'],
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
  // subscription
  {
    id: generateId('subscription', 'read'),
    name: 'Subscription Read',
    description: 'Grants access to read subscriptions',
    scopes: ['dev.cared.api.account'],
    statements: {
      subscription: ['read'],
    },
  },
  {
    id: generateId('subscription', 'write'),
    name: 'Subscription Write',
    description: 'Grants access to write subscriptions',
    scopes: ['dev.cared.api.account'],
    statements: {
      subscription: ['write'],
    },
  },
  // invoice
  {
    id: generateId('invoice', 'read'),
    name: 'Invoice Read',
    description: 'Grants access to read invoices',
    scopes: ['dev.cared.api.account'],
    statements: {
      invoice: ['read'],
    },
  },
  {
    id: generateId('invoice', 'write'),
    name: 'Invoice Write',
    description: 'Grants access to write invoices',
    scopes: ['dev.cared.api.account'],
    statements: {
      invoice: ['write'],
    },
  },
  // providerKey
  {
    id: generateId('providerKey', 'read'),
    name: 'Provider Key Read',
    description: 'Grants access to read provider keys',
    scopes: ['dev.cared.api.account'],
    statements: {
      providerKey: ['read'],
    },
  },
  {
    id: generateId('providerKey', 'write'),
    name: 'Provider Key Write',
    description: 'Grants access to write provider keys',
    scopes: ['dev.cared.api.account'],
    statements: {
      providerKey: ['write'],
    },
  },
  // model
  {
    id: generateId('model', 'read'),
    name: 'AI Model Read',
    description: 'Grants access to read models',
    scopes: ['dev.cared.api.account', 'dev.cared.api.account.user'],
    statements: {
      model: ['read'],
    },
  },
  {
    id: generateId('model', 'write'),
    name: 'AI Model Write',
    description: 'Grants access to write models',
    scopes: ['dev.cared.api.account', 'dev.cared.api.account.user'],
    statements: {
      model: ['write'],
    },
  },
  {
    id: generateId('model', 'invoke'),
    name: 'AI Model Invoke',
    description: 'Grants access to invoke models',
    scopes: ['dev.cared.api.account', 'dev.cared.api.account.user'],
    statements: {
      model: ['invoke'],
    },
  },
  // toolkit
  {
    id: generateId('toolkit', 'read'),
    name: 'Toolkit Read',
    description: 'Grants access to read toolkits',
    scopes: ['dev.cared.api.account'],
    statements: {
      toolkit: ['read'],
    },
  },
  {
    id: generateId('toolkit', 'write'),
    name: 'Toolkit Write',
    description: 'Grants access to write toolkits',
    scopes: ['dev.cared.api.account'],
    statements: {
      toolkit: ['write'],
    },
  },
  {
    id: generateId('toolkit', 'invoke'),
    name: 'Toolkit Invoke',
    description: 'Grants access to invoke toolkits',
    scopes: ['dev.cared.api.account'],
    statements: {
      toolkit: ['invoke'],
    },
  },
  // mcp
  {
    id: generateId('mcp', 'read'),
    name: 'MCP Read',
    description: 'Grants access to read MCP servers',
    scopes: ['dev.cared.api.account'],
    statements: {
      mcp: ['read'],
    },
  },
  {
    id: generateId('mcp', 'write'),
    name: 'MCP Write',
    description: 'Grants access to write MCP servers',
    scopes: ['dev.cared.api.account'],
    statements: {
      mcp: ['write'],
    },
  },
  {
    id: generateId('mcp', 'invoke'),
    name: 'MCP Invoke',
    description: 'Grants access to invoke MCP servers',
    scopes: ['dev.cared.api.account'],
    statements: {
      mcp: ['invoke'],
    },
  },
  // oauthApp
  {
    id: generateId('oauthApp', 'read'),
    name: 'OAuth App Read',
    description: 'Grants access to read OAuth app',
    scopes: ['dev.cared.api.account'],
    statements: {
      oauthApp: ['read'],
    },
  },
  {
    id: generateId('oauthApp', 'write'),
    name: 'OAuth App Write',
    description: 'Grants access to write OAuth app',
    scopes: ['dev.cared.api.account'],
    statements: {
      oauthApp: ['write'],
    },
  },
  // dataset
  {
    id: generateId('dataset', 'read'),
    name: 'Dataset Read',
    description: 'Grants access to read datasets',
    scopes: ['dev.cared.api.account'],
    statements: {
      dataset: ['read'],
    },
  },
  {
    id: generateId('dataset', 'write'),
    name: 'Dataset Write',
    description: 'Grants access to write datasets',
    scopes: ['dev.cared.api.account'],
    statements: {
      dataset: ['write'],
    },
  },
]

export const PERMISSION_GROUPS_MAP = new Map(PERMISSION_GROUPS.map((p) => [p.id, p]))

export async function validateTokenPolicies(
  credentialType: ApiTokenCredentialType,
  policies: TokenPolicy[],
  getUserAccounts: (userId: string) => Promise<
    {
      id: string
      role: AccountRole
    }[]
  >,
  userId?: string
) {
  const allAccountIds = new Set<string>()
  const allUserIds = new Set<string>()
  const formattedPolicies: TokenPolicy[] = []

  for (const policy of policies) {
    const accountIds = new Set<string>()
    const userIds = new Set<string>()
    const allowedScopes = new Set<string>()
    const formattedPolicy: TokenPolicy = {
      effect: policy.effect,
      resources: {},
      permissionGroups: [],
    }
    for (const [resource, value] of Object.entries(policy.resources)) {
      const parts = resource.substring('dev.cared.api.'.length).split('.')
      const resourceType = parts[0]
      switch (resourceType) {
        case 'account':
          if (parts[1] === '*') {
            if (credentialType === 'account') {
              throw new Error(
                'Policies for account API token credential type cannot use dev.cared.api.account.* resources.',
              )
            }
            allAccountIds.add('*')
            accountIds.add('*')
            allowedScopes.add('dev.cared.api.account')
          } else if (typeof value === 'object') {
            if (credentialType === 'user') {
              throw new Error(
                'Policies for user API token credential type cannot use nested dev.cared.api.account.user resources.',
              )
            }
            allAccountIds.add(parts[1]!)
            accountIds.add(parts[1]!)
            allowedScopes.add('dev.cared.api.account.user')
            for (const nestedResource of Object.keys(value)) {
              const nestedParts = nestedResource.substring('dev.cared.api.'.length).split('.')
              if (nestedParts[0] === 'account' && nestedParts[1] === 'user') {
                allUserIds.add(nestedParts[2]!)
                userIds.add(nestedParts[2]!)
              }
            }
          } else {
            allAccountIds.add(parts[1]!)
            accountIds.add(parts[1]!)
            allowedScopes.add('dev.cared.api.account')
          }
          break
        case 'user':
          if (credentialType === 'account') {
            throw new Error(
              'Policies for account API token credential type cannot use dev.cared.api.user resources.',
            )
          }
          allUserIds.add(parts[1]!)
          userIds.add(parts[1]!)
          allowedScopes.add('dev.cared.api.user')
          break
      }
    }

    if (allowedScopes.size !== 1) {
      throw new Error(`One policy item must have exactly one resource scope kind.`)
    }
    const allowedScope = allowedScopes.values().next().value!

    for (const p of policy.permissionGroups) {
      const pg = PERMISSION_GROUPS_MAP.get(p.id)
      if (!pg) {
        throw new Error(`Permission group ${p.id} not found.`)
      }
      if (!pg.scopes.some((pgScope) => allowedScope === pgScope)) {
        throw new Error(
          `Permission group ${p.id} requires at least one resource scope in: ${pg.scopes.join(', ')}.`,
        )
      }
      formattedPolicy.permissionGroups.push({
        id: pg.id,
        name: pg.name,
      })
    }

    if (allowedScope === 'dev.cared.api.user') {
      formattedPolicy.resources = {
        [`dev.cared.api.user.${userIds.values().next().value!}` as const]: '*' as const,
      }
    } else if (allowedScope === 'dev.cared.api.account') {
      if (accountIds.has('*')) {
        formattedPolicy.resources = {
          [`dev.cared.api.account.*` as const]: '*' as const,
        }
      } else {
        formattedPolicy.resources = Object.fromEntries(
          Array.from(accountIds).map((id) => [
            `dev.cared.api.account.${id}` as const,
            '*' as const,
          ]),
        )
      }
    } else if (allowedScope === 'dev.cared.api.account.user') {
      formattedPolicy.resources = {
        [`dev.cared.api.account.${accountIds.values().next().value!}` as const]: {
          [`dev.cared.api.account.user.${userIds.values().next().value!}` as const]: '*' as const,
        },
      }
    }

    formattedPolicies.push(tokenPolicySchema.parse(formattedPolicy))
  }

  if (credentialType === 'user') {
    if (allUserIds.size > 1) {
      throw new Error('Policies for user credential type must have at most one userId.')
    }
    const _userId = allUserIds.values().next().value ?? userId!
    const allAccounts = await getUserAccounts(_userId)
    const allAccountsMap = new Map(allAccounts.map((account) => [account.id, account]))

    if (allAccountIds.has('*')) {
      allAccountIds.clear()
      for (const [id, account] of allAccountsMap.entries()) {
        if (checkPermissionsByRole(account.role, { apiToken: ['write'] })) {
          allAccountIds.add(id)
        }
      }
    } else {
      for (const id of allAccountIds) {
        const account = allAccountsMap.get(id)
        if (!account) {
          throw new Error(`Account ${id} not found.`)
        }
        if (!checkPermissionsByRole(account.role, { apiToken: ['write'] })) {
          throw new Error(`You have no permission to create API tokens for account ${account.id}.`)
        }
      }
    }

    return {
      credentialType,
      formattedPolicies,
      userId,
      accountIds: Array.from(allAccountIds),
    }
  } else {
    if (allAccountIds.size !== 1) {
      throw new Error('Policies for account credential type must have exactly one account id.')
    }
    if (allUserIds.size > 1) {
      throw new Error(
        'Policies for account credential type cannot have multiple different user ids.',
      )
    }

    return {
      credentialType,
      formattedPolicies,
      accountId: allAccountIds.values().next().value!,
      userId: allUserIds.values().next().value,
    }
  }
}

export function checkPermissionsByTokenPolicies<TStatements extends Statements>({
  permissions = { pseudo: [] },
  policies,
  accountId,
  userId,
  role, // only for user credential type
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
        const policyResources = policy.resources
        if (Object.keys(policyResources).length === 0) {
          return false
        }

        for (const [resource, value] of Object.entries(policyResources)) {
          const parts = resource.substring('dev.cared.api.'.length).split('.')
          if (parts.length < 2) {
            continue
          }

          const resourceType = parts[0]
          if (resourceType === 'account' && pgScope === 'dev.cared.api.account') {
            if (value !== '*') {
              continue
            }
            if (parts[1] === '*' || parts[1] === accountId) {
              return true
            }
          } else if (resourceType === 'user' && pgScope === 'dev.cared.api.user') {
            if (value !== '*') {
              continue
            }
            if (parts[1] === userId) {
              return true
            }
          } else if (resourceType === 'account' && pgScope === 'dev.cared.api.account.user') {
            if (parts[1] !== accountId || typeof value !== 'object') {
              continue
            }
            for (const [nestedResource, nestedValue] of Object.entries(value)) {
              const nestedParts = nestedResource.substring('dev.cared.api.'.length).split('.')
              if (nestedParts.length < 3) {
                continue
              }
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (nestedValue !== '*') {
                continue
              }
              if (
                nestedParts[0] === 'account' &&
                nestedParts[1] === 'user' &&
                nestedParts[2] === userId
              ) {
                return true
              }
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

        for (const permissionGroupScope of permissionGroup.scopes) {
          // Check role statements.
          // For user credential type, the permissions granted by an API token's policies
          // must not exceed those granted by the user's role.
          if (
            role &&
            (permissionGroupScope === 'dev.cared.api.account' ||
              permissionGroupScope === 'dev.cared.api.account.user')
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
