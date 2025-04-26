import type { InferSelectModel } from 'drizzle-orm'

import { account, user, verification } from './auth'

export * from './auth'
export * from './character'
export * from './character-group'
export * from './settings'
export * from './model-preset'
export * from './theme'
export * from './lorebook'

export const User = user
export type User = InferSelectModel<typeof User>
export const Account = account
export type Account = InferSelectModel<typeof Account>
export const Verification = verification
export type Verification = InferSelectModel<typeof Verification>
