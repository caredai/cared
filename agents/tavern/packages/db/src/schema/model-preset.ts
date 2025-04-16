import type { ModelPreset as ModelPresetContent } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@ownxai/sdk/utils'

import { user } from './auth'

export const ModelPreset = pgTable(
  'model_preset',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => generateId('mp')),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    preset: jsonb().$type<ModelPresetContent>().notNull(),
    ...timestamps,
  },
  (table) => [
    index().on(table.userId),
    ...timestampsIndices(table),
  ],
)

export type ModelPreset = InferSelectModel<typeof ModelPreset>
