import type { InferSelectModel } from 'drizzle-orm'
import { json, pgEnum, pgTable, primaryKey, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { timestamps } from './utils'

export const workspace = pgTable('workspace', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
})

export type Workspace = InferSelectModel<typeof workspace>

export const CreateWorkspaceSchema = createInsertSchema(workspace, {
  name: z.string().max(255),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const user = pgTable('user', {
  id: varchar({ length: 127 }).primaryKey().notNull(),
  info: json().notNull(),
})

export type User = InferSelectModel<typeof user>

export const CreateUserSchema = createInsertSchema(user, {
  id: z.string().max(255),
  info: z.record(z.unknown()),
}).omit({})

export const roleEnumValues = ['owner', 'member'] as const
export const roleEnum = pgEnum('role', roleEnumValues)

export const membership = pgTable(
  'membership',
  {
    workspaceId: uuid()
      .notNull()
      .references(() => workspace.id),
    userId: varchar({ length: 127 })
      .notNull()
      .references(() => user.id),
    role: roleEnum().notNull().default('member'),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
    }
  },
)

export type Membership = InferSelectModel<typeof membership>

export const CreateMembershipSchema = createInsertSchema(membership, {
  workspaceId: z.string().uuid(),
  userId: z.string().max(127),
  role: z.enum(roleEnumValues).optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
})
