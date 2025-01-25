import { json, pgEnum, pgTable, primaryKey, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { timestamps } from './utils'

export const Workspace = pgTable('workspace', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  name: varchar({ length: 256 }).notNull(),
  ...timestamps,
})

export const CreateWorkspaceSchema = createInsertSchema(Workspace, {
  name: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const User = pgTable('user', {
  id: varchar({ length: 128 }).primaryKey().notNull(),
  info: json().notNull(),
})

export const CreateUserSchema = createInsertSchema(User, {
  id: z.string().max(256),
  info: z.record(z.unknown()),
}).omit({})

export const roleEnumValues = ['owner', 'member'] as const
export const roleEnum = pgEnum('role', roleEnumValues)

export const Membership = pgTable(
  'membership',
  {
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    userId: varchar({ length: 128 })
      .notNull()
      .references(() => User.id),
    role: roleEnum().notNull().default('member'),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
    }
  },
)

export const CreateMembershipSchema = createInsertSchema(Membership, {
  workspaceId: z.string().uuid(),
  userId: z.string().max(128),
  role: z.enum(roleEnumValues).optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
})
