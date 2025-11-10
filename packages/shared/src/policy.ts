import { z } from 'zod/v4'

export type Effect = 'allow' | 'deny'

export type ResourceIdentifier =
  | `dev.cared.api.account.*`
  | `dev.cared.api.account.${string}` // accountId
  | `dev.cared.api.user.${string}` // userId
  | `dev.cared.api.ai.${string}.${string}` // accountId.userId

export type Resources = Record<ResourceIdentifier, '*'>

export type PermissionGroupScope =
  | `dev.cared.api.account`
  | `dev.cared.api.user`
  | `dev.cared.api.ai`

export interface PermissionGroup {
  id: string
  name: string
  description: string
  scopes: PermissionGroupScope[] // actually only one item
}

export interface TokenPolicy {
  id: string
  effect: Effect
  resources: Resources
  permissionGroups: (Pick<PermissionGroup, 'id'> & Partial<Pick<PermissionGroup, 'name'>>)[]
}

const resourceIdentifierSchema = z.union([
  z.literal('dev.cared.api.account.*'),
  z.templateLiteral(['dev.cared.api.account.', z.string()]),
  z.templateLiteral(['dev.cared.api.user.', z.string()]),
  z.templateLiteral(['dev.cared.api.ai.', z.string(), '.', z.string()]),
])

export const tokenPolicySchema = z.object({
  id: z.string(),
  effect: z.enum(['allow', 'deny']),
  resources: z.record(resourceIdentifierSchema, z.literal('*')),
  permissionGroups: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
    }),
  ),
})
