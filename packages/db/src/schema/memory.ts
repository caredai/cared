import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { App } from './app'
import { Chat } from './chat'
import { timestamps, timestampsIndices, timestampsOmits } from './utils'
import { User } from './workspace'

export const Memory = pgTable(
  'memory',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    // The user whom the memory belongs to.
    userId: uuid('userId')
      .notNull()
      .references(() => User.id),
    // The memory is always associated with an app.
    appId: uuid('agentId')
      .notNull()
      .references(() => App.id),
    // Optional. If set, the memory is at `chat` level; otherwise, it's at `app` level.
    chatId: uuid('chatId').references(() => Chat.id),
    content: text('content').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
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
  userId: z.string().uuid(),
  appId: z.string().uuid(),
  chatId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  ...timestampsOmits,
})
