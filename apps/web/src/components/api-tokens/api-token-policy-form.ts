import type { RouterOutputs } from '@cared/api'
import type { Resources, TokenPolicy } from '@cared/shared'

export type PermissionAction = 'read' | 'write' | 'invoke' | 'publish'

type PermissionGroup = RouterOutputs['account']['apiToken']['listPermissionGroups']['permissionGroups'][number]

export type AccountTokenScope = 'entire' | 'member'

export type ApiTokenPolicyFormValues = {
  accountPermissions: Record<string, PermissionAction[]>
  userPermissions: Record<string, PermissionAction[]>
  accountScope?: 'all' | 'specific'
  accountIds?: string[]
  accountTokenScope?: AccountTokenScope
  memberUserId?: string
}

function addPermissionAction(
  perms: Record<string, { actions: string[] }>,
  resourceName: string,
  action: string,
) {
  perms[resourceName] ??= { actions: [] }
  const resourceActions = perms[resourceName].actions
  if (!resourceActions.includes(action)) {
    resourceActions.push(action)
  }
}

export function organizePermissions(permissionGroups: PermissionGroup[]) {
  const accountPerms: Record<string, { actions: string[] }> = {}
  const userPerms: Record<string, { actions: string[] }> = {}

  permissionGroups.forEach((group) => {
    const hasAccount = group.scopes.includes('dev.cared.api.account')
    const hasUser = group.scopes.includes('dev.cared.api.user')
    const onlyAccountUserScope =
      group.scopes.includes('dev.cared.api.account.user') && !hasAccount && !hasUser

    if (onlyAccountUserScope) return

    const resourceName = Object.keys(group.statements)[0]
    if (!resourceName) return

    const actions = group.statements[resourceName as keyof typeof group.statements] ?? []
    const action = actions[0]
    if (!action) return

    // Groups may list multiple scopes (e.g. apiToken on both account and user).
    if (hasAccount) {
      addPermissionAction(accountPerms, resourceName, action)
    }
    if (hasUser) {
      addPermissionAction(userPerms, resourceName, action)
    }
  })

  return { accountPerms, userPerms }
}

/** Permission groups that support dev.cared.api.account.user (member-scoped account tokens). */
export function organizeAccountUserPermissions(permissionGroups: PermissionGroup[]) {
  const accountUserPerms: Record<string, { actions: string[] }> = {}

  permissionGroups.forEach((group) => {
    if (!group.scopes.includes('dev.cared.api.account.user')) return

    const resourceName = Object.keys(group.statements)[0]
    if (!resourceName) return

    const actions = group.statements[resourceName as keyof typeof group.statements] ?? []
    const action = actions[0]
    if (!action) return

    accountUserPerms[resourceName] ??= { actions: [] }
    const resourceActions = accountUserPerms[resourceName].actions
    if (!resourceActions.includes(action)) {
      resourceActions.push(action)
    }
  })

  return { accountUserPerms }
}

export function createEmptyPermissions(organizedPermissions: ReturnType<typeof organizePermissions>) {
  const accountPermissions: Record<string, PermissionAction[]> = {}
  const userPermissions: Record<string, PermissionAction[]> = {}

  Object.keys(organizedPermissions.accountPerms).forEach((resourceName) => {
    accountPermissions[resourceName] = []
  })

  Object.keys(organizedPermissions.userPerms).forEach((resourceName) => {
    userPermissions[resourceName] = []
  })

  return { accountPermissions, userPermissions }
}

export function createEmptyAccountUserPermissions(
  organizedPermissions: ReturnType<typeof organizeAccountUserPermissions>,
) {
  const accountPermissions: Record<string, PermissionAction[]> = {}

  Object.keys(organizedPermissions.accountUserPerms).forEach((resourceName) => {
    accountPermissions[resourceName] = []
  })

  return accountPermissions
}

type PermissionGroupScope =
  | 'dev.cared.api.account'
  | 'dev.cared.api.user'
  | 'dev.cared.api.account.user'

function getPermissionGroupId(
  permissionGroups: PermissionGroup[],
  resourceName: string,
  action: string,
  permScope: PermissionGroupScope,
) {
  return permissionGroups.find(
    (group) =>
      group.scopes.includes(permScope) &&
      Object.keys(group.statements)[0] === resourceName &&
      group.statements[resourceName as keyof typeof group.statements]?.[0] === action,
  )?.id
}

export function buildPoliciesFromFormValues({
  credentialType,
  permissionGroups,
  accountPermissions,
  userPermissions,
  accountScope,
  accountIds,
  accountTokenScope = 'entire',
  memberUserId,
  activeAccountId,
  userId,
}: {
  credentialType: 'account' | 'user'
  permissionGroups: PermissionGroup[]
  accountPermissions?: Record<string, PermissionAction[]>
  userPermissions?: Record<string, PermissionAction[]>
  accountScope?: 'all' | 'specific'
  accountIds?: string[]
  accountTokenScope?: AccountTokenScope
  memberUserId?: string
  activeAccountId?: string
  userId?: string
}): Omit<TokenPolicy, 'id'>[] {
  const policies: Omit<TokenPolicy, 'id'>[] = []

  if (accountPermissions) {
    const isMemberScopedAccountToken =
      credentialType === 'account' && accountTokenScope === 'member' && memberUserId
    const accountPermissionScope: PermissionGroupScope = isMemberScopedAccountToken
      ? 'dev.cared.api.account.user'
      : 'dev.cared.api.account'

    const accountPermissionGroupIds: string[] = []
    Object.entries(accountPermissions).forEach(([resourceName, actions]) => {
      for (const action of actions) {
        const groupId = getPermissionGroupId(
          permissionGroups,
          resourceName,
          action,
          accountPermissionScope,
        )
        if (groupId) {
          accountPermissionGroupIds.push(groupId)
        }
      }
    })

    if (accountPermissionGroupIds.length > 0) {
      if (isMemberScopedAccountToken && activeAccountId) {
        policies.push({
          effect: 'allow',
          resources: {
            [`dev.cared.api.account.${activeAccountId}`]: {
              [`dev.cared.api.account.user.${memberUserId}`]: '*',
            },
          } as Resources,
          permissionGroups: accountPermissionGroupIds.map((id) => ({ id })),
        })
      } else {
      const policyResources: Record<string, '*'> = {}
      if (credentialType === 'account') {
        if (activeAccountId) {
          policyResources[`dev.cared.api.account.${activeAccountId}`] = '*'
        }
      } else if (accountScope === 'all') {
        policyResources['dev.cared.api.account.*'] = '*'
      } else if (accountIds && accountIds.length > 0) {
        accountIds.forEach((accountId) => {
          policyResources[`dev.cared.api.account.${accountId}`] = '*'
        })
      } else {
        policyResources['dev.cared.api.account.*'] = '*'
      }

      if (Object.keys(policyResources).length > 0) {
        policies.push({
          effect: 'allow',
          resources: policyResources as Resources,
          permissionGroups: accountPermissionGroupIds.map((id) => ({ id })),
        })
      }
      }
    }
  }

  if (userPermissions && credentialType === 'user' && userId) {
    const userPermissionGroupIds: string[] = []
    Object.entries(userPermissions).forEach(([resourceName, actions]) => {
      for (const action of actions) {
        const groupId = getPermissionGroupId(
          permissionGroups,
          resourceName,
          action,
          'dev.cared.api.user',
        )
        if (groupId) {
          userPermissionGroupIds.push(groupId)
        }
      }
    })

    if (userPermissionGroupIds.length > 0) {
      policies.push({
        effect: 'allow',
        resources: {
          [`dev.cared.api.user.${userId}`]: '*',
        } as Resources,
        permissionGroups: userPermissionGroupIds.map((id) => ({ id })),
      })
    }
  }

  return policies
}

type PolicyResourceScope = 'account' | 'user' | 'account.user'

function getPolicyResourceScope(policy: TokenPolicy): PolicyResourceScope | null {
  for (const [resourceKey, resourceValue] of Object.entries(policy.resources)) {
    if (resourceKey === 'dev.cared.api.account.*') {
      return 'account'
    }
    if (resourceKey.startsWith('dev.cared.api.user.')) {
      return 'user'
    }
    if (
      resourceKey.startsWith('dev.cared.api.account.') &&
      typeof resourceValue === 'object' &&
      resourceValue !== null
    ) {
      return 'account.user'
    }
    if (resourceKey.startsWith('dev.cared.api.account.')) {
      return 'account'
    }
  }
  return null
}

function detectAccountTokenScope(policies: TokenPolicy[]) {
  let accountTokenScope: AccountTokenScope = 'entire'
  let memberUserId: string | undefined

  for (const policy of policies) {
    for (const [resourceKey, resourceValue] of Object.entries(policy.resources)) {
      if (
        resourceKey.startsWith('dev.cared.api.account.') &&
        resourceKey !== 'dev.cared.api.account.*' &&
        typeof resourceValue === 'object' &&
        resourceValue !== null
      ) {
        accountTokenScope = 'member'
        for (const nestedKey of Object.keys(resourceValue)) {
          if (nestedKey.startsWith('dev.cared.api.account.user.')) {
            memberUserId = nestedKey.replace('dev.cared.api.account.user.', '')
          }
        }
      }
    }
  }

  return { accountTokenScope, memberUserId }
}

export function parsePoliciesToFormValues(
  policies: TokenPolicy[],
  permissionGroups: PermissionGroup[],
  credentialType: 'account' | 'user',
): ApiTokenPolicyFormValues {
  const { accountTokenScope, memberUserId } =
    credentialType === 'account'
      ? detectAccountTokenScope(policies)
      : { accountTokenScope: 'entire' as const, memberUserId: undefined }

  const organizedPermissions = organizePermissions(permissionGroups)
  const organizedAccountUserPermissions = organizeAccountUserPermissions(permissionGroups)
  const { accountPermissions, userPermissions } =
    credentialType === 'account' && accountTokenScope === 'member'
      ? {
          accountPermissions: createEmptyAccountUserPermissions(organizedAccountUserPermissions),
          userPermissions: createEmptyPermissions(organizedPermissions).userPermissions,
        }
      : createEmptyPermissions(organizedPermissions)

  let accountScope: 'all' | 'specific' | undefined =
    credentialType === 'user' ? 'all' : undefined
  let accountIds: string[] = []

  for (const policy of policies) {
    if (policy.effect !== 'allow') continue

    const policyScope = getPolicyResourceScope(policy)
    if (!policyScope) continue

    const permissionGroupScope: PermissionGroupScope =
      policyScope === 'user'
        ? 'dev.cared.api.user'
        : policyScope === 'account.user'
          ? 'dev.cared.api.account.user'
          : 'dev.cared.api.account'

    const targetPermissions = policyScope === 'user' ? userPermissions : accountPermissions

    for (const permissionGroup of policy.permissionGroups) {
      const group = permissionGroups.find((entry) => entry.id === permissionGroup.id)
      if (!group) continue

      if (!group.scopes.includes(permissionGroupScope)) continue

      const resourceName = Object.keys(group.statements)[0]
      if (!resourceName) continue

      const actions = group.statements[resourceName as keyof typeof group.statements] ?? []
      const action = actions[0] as PermissionAction | undefined
      if (!action) continue

      const current = targetPermissions[resourceName] ?? []
      if (!current.includes(action)) {
        targetPermissions[resourceName] = [...current, action]
      }
    }

    if (credentialType === 'user') {
      const resourceKeys = Object.keys(policy.resources)
      if (resourceKeys.includes('dev.cared.api.account.*')) {
        accountScope = 'all'
        accountIds = []
      } else {
        const specificAccountIds = resourceKeys
          .filter((key) => key.startsWith('dev.cared.api.account.'))
          .map((key) => key.replace('dev.cared.api.account.', ''))
          .filter((id) => id.length > 0)

        if (specificAccountIds.length > 0) {
          accountScope = 'specific'
          accountIds = specificAccountIds
        }
      }
    }
  }

  return {
    accountPermissions,
    userPermissions,
    accountScope,
    accountIds,
    accountTokenScope: credentialType === 'account' ? accountTokenScope : undefined,
    memberUserId,
  }
}
