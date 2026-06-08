import { z } from 'zod/v4'

export type Effect = 'allow' | 'deny'

export const resourcesSchema = z.union([
  z.record(
    z.union([
      // all accounts of specific user
      z.literal('dev.cared.api.account.*'),
      // specific user
      z.templateLiteral(['dev.cared.api.user.', z.string()]),
    ]),
    z.literal('*'),
  ),
  z.record(
    z.templateLiteral(['dev.cared.api.account.', z.string()]),
    z.union([
      // specific account
      z.literal('*'),
      // specific user (member) of specific account
      z.record(z.templateLiteral(['dev.cared.api.account.user.', z.string()]), z.literal('*')),
    ]),
  ),
])

export type ResourceIdentifier =
  | `dev.cared.api.account.*`
  | `dev.cared.api.account.${string}`
  | `dev.cared.api.user.${string}`

export type ResourceValue = '*' | Record<`dev.cared.api.account.user.${string}`, '*'>

export type Resources = z.infer<typeof resourcesSchema>

export type PermissionGroupScope =
  | `dev.cared.api.account`
  | `dev.cared.api.user`
  | `dev.cared.api.account.user`

export interface PermissionGroup {
  id: string
  name: string
  description: string
  scopes: PermissionGroupScope[]
}

export interface TokenPolicy {
  effect: Effect
  resources: Resources
  permissionGroups: (Pick<PermissionGroup, 'id'> & Partial<Pick<PermissionGroup, 'name'>>)[]
}

export const tokenPolicySchema = z.object({
  effect: z.enum(['allow', 'deny']),
  resources: resourcesSchema,
  permissionGroups: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
    }),
  ),
})
