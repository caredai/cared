import type { InferSelectModel } from 'drizzle-orm'
import { jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core'

import { User, Workspace } from './workspace'

export interface Secret {
  providerKeys: Record<string, string>
}

export const UserSecret = pgTable('user_secret', {
  userId: varchar({ length: 127 })
    .primaryKey()
    .notNull()
    .references(() => User.id),
  secret: jsonb().$type<Secret>().notNull(),
})

export type UserSecret = InferSelectModel<typeof UserSecret>

export const WorkspaceSecret = pgTable('workspace_secret', {
  workspaceId: text()
    .primaryKey()
    .notNull()
    .references(() => Workspace.id),
  secret: jsonb().$type<Secret>().notNull(),
})

export type WorkspaceSecret = InferSelectModel<typeof WorkspaceSecret>
