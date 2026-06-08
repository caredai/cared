import * as crypto from 'node:crypto'

import type { TokenPolicy } from '@cared/shared'

import type { AccountRole } from './account'

export const TEST_USER_ID = 'usr_test'
export const TEST_ACCOUNT_A = 'acc_a'
export const TEST_ACCOUNT_B = 'acc_b'
export const TEST_MEMBER_USER = 'usr_member'

/** Mirrors PERMISSION_GROUPS id generation in permission.ts */
export function permissionGroupId(resource: string, action: string) {
  return crypto.createHash('md5').update(`${resource}:${action}`).digest('hex')
}

export function allowPolicy(opts: {
  resources: TokenPolicy['resources']
  group: { resource: string; action: string }
  effect?: TokenPolicy['effect']
}): TokenPolicy {
  const { resource, action } = opts.group
  return {
    effect: opts.effect ?? 'allow',
    resources: opts.resources,
    permissionGroups: [{ id: permissionGroupId(resource, action) }],
  }
}

export function mockUserAccounts(accounts: { id: string; role: AccountRole }[]) {
  return async () => accounts
}
