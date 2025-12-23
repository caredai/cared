import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from './utils'
import { Account } from './auth'
import { User } from './auth-alias'

export const memoryModes = ['uncontrolled', 'managed'] as const
export type MemoryMode = (typeof memoryModes)[number]
export const memoryModeEnum = pgEnum('memoryMode', memoryModes)

export const MemoryStore = pgTable(
  'memory_store',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId('ms')),
    name: text().notNull(),
    mode: memoryModeEnum().notNull(),
    // For `uncontrolled` mode
    accountId: text().references(() => Account.id),
    // For `managed` mode
    userId: text().references(() => User.id),
    ...timestamps,
  },
  (table) => [
    index().on(table.name),
    ...timestampsIndices(table),
  ],
)

export type MemoryStore = InferSelectModel<typeof MemoryStore>

export const memoryEntities = ['user', 'agent', 'app', 'run'] as const
export type MemoryEntity = (typeof memoryEntities)[number]
export const memoryEntityEnum = pgEnum('memoryEntity', memoryEntities)

export const MemorySpace = pgTable(
  'memory_space',
  {
    id: text()
      .primaryKey(), // user_id/agent_id/app_id/run_id
    storeId: text().references(() => MemoryStore.id),
    entity: memoryEntityEnum().notNull(),
    ...timestamps,
  },
  (table) => [
    ...timestampsIndices(table),
  ],
)

export type MemorySpace = InferSelectModel<typeof MemorySpace>

export const memoryActions = ['add', 'update', 'delete'] as const
export type MemoryAction = (typeof memoryActions)[number]
export const memoryActionEnum = pgEnum('memoryAction', memoryActions)

export interface MemoryInput {
  role?: 'system' | 'assistant' | 'user'
  content?: string
}

export const MemoryHistory = pgTable(
  'memory_history',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId('mh')),
    memoryId: text().notNull(),
    oldMemory: text(),
    newMemory: text(),
    action: memoryActionEnum().notNull(),
    input: jsonb().$type<MemoryInput>(),
    ...timestamps,
  },
  (table) => [
    index().on(table.memoryId),
  ],
)

export type MemoryHistory = InferSelectModel<typeof MemoryHistory>
