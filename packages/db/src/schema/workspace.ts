import type { InferSelectModel } from 'drizzle-orm'
import { index, json, pgTable, primaryKey, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import {roleEnum, roleEnumValues, timestamps, timestampsIndices, timestampsOmits} from './utils'

export const Workspace = pgTable('workspace', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
})

export type Workspace = InferSelectModel<typeof Workspace>

export const CreateWorkspaceSchema = createInsertSchema(Workspace, {
  name: z.string().max(255),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const User = pgTable('user', {
  id: varchar({ length: 127 }).primaryKey().notNull(),
  info: json().notNull().default({}),
})

export type User = InferSelectModel<typeof User>

export const CreateUserSchema = createInsertSchema(User, {
  id: z.string().max(255),
  info: z.record(z.unknown()).optional(),
}).omit({})

export const Membership = pgTable(
  'membership',
  {
    workspaceId: uuid()
      .notNull()
      .references(() => Workspace.id),
    userId: varchar({ length: 127 })
      .notNull()
      .references(() => User.id),
    role: roleEnum().notNull().default('member'),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type Membership = InferSelectModel<typeof Membership>

export const CreateMembershipSchema = createInsertSchema(Membership, {
  workspaceId: z.string().uuid(),
  userId: z.string().max(127),
  role: z.enum(roleEnumValues).optional(),
}).omit({
  ...timestampsOmits,
})
