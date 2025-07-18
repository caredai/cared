import type { ModelPreset as ModelPresetContent, ModelPresetCustomization } from '@tavern/core'
import type { InferSelectModel } from 'drizzle-orm'
import { jsonb, pgTable, text, unique } from 'drizzle-orm/pg-core'

import { generateId, timestamps, timestampsIndices } from '@ownxai/sdk'

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
    name: text().notNull(),
    preset: jsonb().$type<ModelPresetContent>().notNull(),
    customization: jsonb().$type<ModelPresetCustomization>(),
    ...timestamps,
  },
  (table) => [
    // `name` is unique per user
    unique().on(table.userId, table.name),
    ...timestampsIndices(table),
  ],
)

export type ModelPreset = InferSelectModel<typeof ModelPreset>
