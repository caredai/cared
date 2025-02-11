import type { User as ClerkUser } from '@clerk/nextjs/server'
import type { InferSelectModel } from 'drizzle-orm'
import { index, json, pgTable, primaryKey, uuid, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { roleEnum, roleEnumValues, timestamps, timestampsIndices, timestampsOmits } from './utils'

export const Workspace = pgTable('workspace', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
})

export type Workspace = InferSelectModel<typeof Workspace>

export const CreateWorkspaceSchema = createInsertSchema(Workspace, {
  name: z.string().min(1).max(255),
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateWorkspaceSchema = createUpdateSchema(Workspace, {
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
}).omit({
  ...timestampsOmits,
})

export const User = pgTable('user', {
  id: varchar({ length: 127 }).primaryKey().notNull(),
  info: json().$type<ClerkUser>().notNull(),
  ...timestamps,
})

export type User = InferSelectModel<typeof User>

export const CreateOrUpdateUserSchema = createInsertSchema(User, {
  id: z.string().max(255),
  info: z.record(z.unknown()),
}).omit({
  ...timestampsOmits,
})

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
    index().on(table.workspaceId, table.role),
    index().on(table.userId, table.role),
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
