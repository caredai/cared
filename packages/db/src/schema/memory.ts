import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { App } from './app'
import { Chat } from './chat'
import { generateId, timestamps, timestampsIndices, timestampsOmits } from './utils'
import { User } from './workspace'

export type MemoryMetadata = Record<string, unknown>

const memoryMetadataZod = z.object({}).catchall(z.unknown())

export const Memory = pgTable(
  'memory',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('mem')),
    // The user whom the memory belongs to.
    userId: text()
      .notNull()
      .references(() => User.id),
    // The memory is always associated with an app.
    appId: text()
      .notNull()
      .references(() => App.id),
    // Optional. If set, the memory is at `chat` level; otherwise, it's at `app` level.
    chatId: text().references(() => Chat.id),
    content: text().notNull(),
    metadata: jsonb().$type<MemoryMetadata>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId, table.appId, table.chatId),
    index().on(table.appId),
    index().on(table.chatId),
    ...timestampsIndices(table),
  ],
)

export type Memory = InferSelectModel<typeof Memory>

export const CreateMemorySchema = createInsertSchema(Memory, {
  content: z.string(),
  userId: z.string(),
  appId: z.string(),
  chatId: z.string().optional(),
  metadata: memoryMetadataZod.optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})
