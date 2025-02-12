import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agent } from './agent'
import { timestamps } from './utils'
import { User } from './workspace'

export const room = pgTable(
  'room',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    name: text().notNull(),
    ownerId: uuid()
      .notNull()
      .references(() => User.id),
    metadata: jsonb().$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index().on(table.ownerId),
  ],
)

export type Room = InferSelectModel<typeof room>

export const CreateRoomSchema = createInsertSchema(room, {
  name: z.string(),
  metadata: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const userParticipant = pgTable(
  'user_participant',
  {
    roomId: uuid()
      .notNull()
      .references(() => room.id),
    userId: uuid()
      .notNull()
      .references(() => User.id),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.userId] }),
  ],
)

export type UserParticipant = InferSelectModel<typeof userParticipant>

export const CreateUserParticipantSchema = createInsertSchema(userParticipant, {
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
}).omit({
  createdAt: true,
  updatedAt: true,
})

export const agentParticipant = pgTable(
  'agent_participant',
  {
    roomId: uuid()
      .notNull()
      .references(() => room.id),
    agentId: uuid()
      .notNull()
      .references(() => agent.id),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.agentId] }),
  ],
)

export type AgentParticipant = InferSelectModel<typeof agentParticipant>

export const CreateAgentParticipantSchema = createInsertSchema(agentParticipant, {
  roomId: z.string().uuid(),
  agentId: z.string().uuid(),
}).omit({
  createdAt: true,
  updatedAt: true,
})
