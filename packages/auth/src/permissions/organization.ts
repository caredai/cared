import type { Statements } from 'better-auth/plugins/access'
import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc as defaultAdminAc,
  memberAc as defaultMemberAc,
  ownerAc as defaultOwnerAc,
  defaultStatements,
} from 'better-auth/plugins/organization'

export type StatementsSubset<TStatements extends Statements> = {
  [P in keyof TStatements]?: TStatements[P][number][]
}

export type OrganizationStatementsSubset = StatementsSubset<typeof statements>

const statements = {
  ...defaultStatements,
  providerKey: ['create', 'update', 'delete'],
  workspace: ['create', 'update', 'transfer', 'delete'],
  app: ['create', 'update', 'delete', 'publish'],
  dataset: ['create', 'update', 'delete'],
} as const

export const orgAc = createAccessControl(statements)

const ownerAc = orgAc.newRole({
  ...defaultOwnerAc.statements,
  providerKey: ['create', 'update', 'delete'],
  workspace: ['create', 'update', 'transfer', 'delete'],
  app: ['create', 'update', 'delete', 'publish'],
  dataset: ['create', 'update', 'delete'],
})

const adminAc = orgAc.newRole({
  ...defaultAdminAc.statements,
  providerKey: ['create', 'update', 'delete'],
  workspace: ['create', 'update', 'delete'],
  app: ['create', 'update', 'delete', 'publish'],
  dataset: ['create', 'update', 'delete'],
})

const memberAc = orgAc.newRole({
  ...defaultMemberAc.statements,
  workspace: [],
  app: [],
  dataset: [],
})

export const orgRoles = {
  owner: ownerAc,
  admin: adminAc,
  member: memberAc,
}

export type OrganizationRole = keyof typeof orgRoles
