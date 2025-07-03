import type { InferSelectModel } from 'drizzle-orm'
import { index, pgTable, primaryKey, text, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

import { User } from '.'
import {
  generateId,
  roleEnum,
  roleEnumValues,
  timestamps,
  timestampsIndices,
  timestampsOmits,
} from './utils'

export const Workspace = pgTable('workspace', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateId('workspace')),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
})

export type Workspace = InferSelectModel<typeof Workspace>

const workspaceNameSchema = z
  .string()
  .min(1, 'Workspace name cannot be empty')
  .max(255, 'Workspace name cannot be longer than 255 characters')

export const CreateWorkspaceSchema = createInsertSchema(Workspace, {
  name: workspaceNameSchema,
}).omit({
  id: true,
  ...timestampsOmits,
})

export const UpdateWorkspaceSchema = createUpdateSchema(Workspace, {
  id: z.string(),
  name: workspaceNameSchema,
}).omit({
  ...timestampsOmits,
})

export const Membership = pgTable(
  'membership',
  {
    workspaceId: text()
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
  workspaceId: z.string(),
  userId: z.string().max(127),
  role: z.enum(roleEnumValues).optional(),
}).omit({
  ...timestampsOmits,
})
