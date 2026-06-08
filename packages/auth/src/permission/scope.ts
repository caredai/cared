import type { Role, Statements } from 'better-auth/plugins/access'
import { z } from 'zod/v4'

import type { OAuthAppScope } from '@cared/shared'

import type { AccountRole } from './roles'
import type { StatementsSubset } from './statement'
import { accountRoles } from './roles'

export function scopeId(name: string, action: string) {
  return `${name}:${action}`
}

/** OIDC scopes handled by the OAuth provider (not mapped to statements). */
export const OAUTH_STANDARD_SCOPES = ['openid', 'profile', 'email', 'offline_access'] as const

export const OAUTH_APP_SCOPES: (OAuthAppScope & {
  statements: StatementsSubset // actually one name and one action
})[] = [
  // account
  {
    id: scopeId('account', 'read'),
    name: 'Account Read',
    statements: {
      account: ['read'],
    },
  },
  {
    id: scopeId('account', 'write'),
    name: 'Account Write',
    statements: {
      account: ['write'],
    },
  },
  // member
  {
    id: scopeId('member', 'read'),
    name: 'Member Read',
    statements: {
      member: ['read'],
    },
  },
  {
    id: scopeId('member', 'write'),
    name: 'Member Write',
    statements: {
      member: ['write'],
    },
  },
  // invitation
  {
    id: scopeId('invitation', 'read'),
    name: 'Invitation Read',
    statements: {
      invitation: ['read'],
    },
  },
  {
    id: scopeId('invitation', 'write'),
    name: 'Invitation Write',
    statements: {
      invitation: ['write'],
    },
  },
  /*
  // apiToken
  {
    id: scopeId('apiToken', 'read'),
    name: 'API Token Read',
    statements: {
      apiToken: ['read'],
    },
  },
  {
    id: scopeId('apiToken', 'write'),
    name: 'API Token Write',
    statements: {
      apiToken: ['write'],
    },
  },
  */
  // credits
  {
    id: scopeId('credits', 'read'),
    name: 'Credits Read',
    statements: {
      credits: ['read'],
    },
  },
  {
    id: scopeId('credits', 'write'),
    name: 'Credits Write',
    statements: {
      credits: ['write'],
    },
  },
  // subscription
  {
    id: scopeId('subscription', 'read'),
    name: 'Subscription Read',
    statements: {
      subscription: ['read'],
    },
  },
  {
    id: scopeId('subscription', 'write'),
    name: 'Subscription Write',
    statements: {
      subscription: ['write'],
    },
  },
  // invoice
  {
    id: scopeId('invoice', 'read'),
    name: 'Invoice Read',
    statements: {
      invoice: ['read'],
    },
  },
  {
    id: scopeId('invoice', 'write'),
    name: 'Invoice Write',
    statements: {
      invoice: ['write'],
    },
  },
  // providerKey
  {
    id: scopeId('providerKey', 'read'),
    name: 'Provider Key Read',
    statements: {
      providerKey: ['read'],
    },
  },
  {
    id: scopeId('providerKey', 'write'),
    name: 'Provider Key Write',
    statements: {
      providerKey: ['write'],
    },
  },
  // model
  {
    id: scopeId('model', 'read'),
    name: 'AI Model Read',
    statements: {
      model: ['read'],
    },
  },
  {
    id: scopeId('model', 'write'),
    name: 'AI Model Write',
    statements: {
      model: ['write'],
    },
  },
  {
    id: scopeId('model', 'invoke'),
    name: 'AI Model Invoke',
    statements: {
      model: ['invoke'],
    },
  },
  // toolkit
  {
    id: scopeId('toolkit', 'read'),
    name: 'Toolkit Read',
    statements: {
      toolkit: ['read'],
    },
  },
  {
    id: scopeId('toolkit', 'write'),
    name: 'Toolkit Write',
    statements: {
      toolkit: ['write'],
    },
  },
  {
    id: scopeId('toolkit', 'invoke'),
    name: 'Toolkit Invoke',
    statements: {
      toolkit: ['invoke'],
    },
  },
  // mcp
  {
    id: scopeId('mcp', 'read'),
    name: 'MCP Read',
    statements: {
      mcp: ['read'],
    },
  },
  {
    id: scopeId('mcp', 'write'),
    name: 'MCP Write',
    statements: {
      mcp: ['write'],
    },
  },
  {
    id: scopeId('mcp', 'invoke'),
    name: 'MCP Invoke',
    statements: {
      mcp: ['invoke'],
    },
  },
  /*
  // oauthApp
  {
    id: scopeId('oauthApp', 'read'),
    name: 'OAuth App Read',
    statements: {
      oauthApp: ['read'],
    },
  },
  {
    id: scopeId('oauthApp', 'write'),
    name: 'OAuth App Write',
    statements: {
      oauthApp: ['write'],
    },
  },
  */
  // dataset
  {
    id: scopeId('dataset', 'read'),
    name: 'Dataset Read',
    statements: {
      dataset: ['read'],
    },
  },
  {
    id: scopeId('dataset', 'write'),
    name: 'Dataset Write',
    statements: {
      dataset: ['write'],
    },
  },
]

export const OAUTH_APP_SCOPES_MAP = new Map(OAUTH_APP_SCOPES.map((scope) => [scope.id, scope]))

export const OAUTH_PROVIDER_SCOPES = [
  ...OAUTH_STANDARD_SCOPES,
  ...OAUTH_APP_SCOPES.map((scope) => scope.id),
]

export const oauthProviderScopesSchema = z
  .array(z.enum(OAUTH_PROVIDER_SCOPES))
  .refine((scopes) => new Set(scopes).size === scopes.length, {
    message: 'Scopes must be unique',
  })

const OAUTH_STANDARD_SCOPE_SET = new Set<string>(OAUTH_STANDARD_SCOPES)

export function hasNonStandardOAuthScopes(scopes: string[]): boolean {
  return scopes.some((scope) => !OAUTH_STANDARD_SCOPE_SET.has(scope))
}

export function resolveOAuthAppScopes(scopes: string[]): OAuthAppScope[] {
  const resolved: OAuthAppScope[] = []
  for (const scope of scopes) {
    const entry = OAUTH_APP_SCOPES_MAP.get(scope)
    if (entry) {
      resolved.push({ id: entry.id, name: entry.name })
    }
  }
  return resolved
}

function oauthScopeId(scope: string | OAuthAppScope): string {
  return typeof scope === 'string' ? scope : scope.id
}

export function checkPermissionsByOAuthAppScopes<TStatements extends Statements>({
  permissions = { pseudo: [] },
  scopes,
  role,
}: {
  permissions?: StatementsSubset
  scopes: string[] | OAuthAppScope[]
  role?: Role<TStatements> | AccountRole
}): boolean {
  function checkPermission(checkName: string, checkAction: string): boolean {
    for (const scope of scopes) {
      const entry = OAUTH_APP_SCOPES_MAP.get(oauthScopeId(scope))
      if (!entry) {
        continue
      }

      const matched = entry.statements[checkName as keyof typeof entry.statements]?.includes(
        checkAction as never,
      )
      if (!matched) {
        continue
      }

      if (role) {
        const roleInstance = typeof role === 'string' ? accountRoles[role] : role
        const actionsFromRole =
          roleInstance.statements[checkName as keyof (typeof roleInstance)['statements']]
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!actionsFromRole || !actionsFromRole.includes(checkAction as any)) {
          continue
        }
      }

      return true
    }

    return false
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
