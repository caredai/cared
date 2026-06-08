import type { organization } from 'better-auth/plugins'
import { clientSideHasPermission } from 'better-auth/client/plugins'

import type { AccountRole } from './roles'
import type { StatementsSubset } from './statement'
import { auth } from '../server'
import { accountRoles } from './roles'

export { accountAc, accountRoles, type AccountRole } from './roles'

export function checkPermissionsByRole(
  role: AccountRole,
  permissions: StatementsSubset = { pseudo: [] },
) {
  // eslint-disable-next-line no-restricted-properties,turbo/no-undeclared-env-vars
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return _checkPermissionsByRole(role, permissions)
  }

  const orgPlugin = auth.options.plugins.find(
    (plugin) => plugin.id === 'organization',
  ) as unknown as ReturnType<typeof organization>

  return clientSideHasPermission({
    role,
    options: orgPlugin.options,
    permissions,
  })
}

function _checkPermissionsByRole(
  role: AccountRole,
  permissions: StatementsSubset = { pseudo: [] },
): boolean {
  const roleStatements = accountRoles[role].statements

  for (const [name, actions] of Object.entries(permissions)) {
    if (name === 'pseudo') {
      continue
    }
    const allowed = roleStatements[name as keyof typeof roleStatements] as
      | readonly string[]
      | undefined
    if (!allowed) {
      return false
    }
    for (const action of actions) {
      if (!allowed.includes(action)) {
        return false
      }
    }
  }

  return true
}
