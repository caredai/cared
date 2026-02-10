import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgEnum, pgTable, text, unique } from 'drizzle-orm/pg-core'

import { Account } from './auth'
import { User } from './auth-alias'
import { generateId, timestamps, timestampsIndices } from './utils'

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
    accountId: text()
      .notNull()
      .references(() => Account.id),
    // Only for `managed` mode
    userId: text().references(() => User.id),
    ...timestamps,
  },
  (table) => [
    index().on(table.mode, table.accountId, table.userId),
    ...timestampsIndices(table),
  ],
)

export type MemoryStore = InferSelectModel<typeof MemoryStore>

export const memoryPrimaryEntities = ['user', 'agent', 'app', 'run'] as const
export type MemoryPrimaryEntity = (typeof memoryPrimaryEntities)[number]
export const memoryPrimaryEntityEnum = pgEnum('memoryEntity', memoryPrimaryEntities)

export const MemorySpace = pgTable(
  'memory_space',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId('msp')),
    storeId: text()
      .notNull()
      .references(() => MemoryStore.id),
    primary: memoryPrimaryEntityEnum().notNull(),
    entityId: text().notNull(),
    ...timestamps,
  },
  (table) => [
    unique().on(table.storeId, table.primary, table.entityId),
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
