import { z } from 'zod'

import type { LorebookContent } from './types'
import { lorebookEntrySchema } from './types'

export const lorebookUpdatesSchema = z
  .array(
    z.union([
      z.object({
        type: z.literal('updateName'),
        name: z.string(),
      }),
      z.object({
        type: z.literal('updateDescription'),
        description: z.string(),
      }),
      z.object({
        type: z.literal('addEntry'),
        entry: lorebookEntrySchema,
      }),
      z.object({
        type: z.literal('updateEntry'),
        index: z.number().int().nonnegative(),
        entry: lorebookEntrySchema,
      }),
      z.object({
        type: z.literal('removeEntry'),
        index: z.number().int().nonnegative(),
      }),
    ]),
  )
  .min(1)

export type LorebookUpdates = z.infer<typeof lorebookUpdatesSchema>

export function updateLorebook(
  lorebook: LorebookContent,
  updates: LorebookUpdates,
):
  | {
      updates: Partial<LorebookContent>
      error?: never
    }
  | {
      updates?: never
      error: string
    } {
  const result = {} as LorebookContent
  for (const update of updates) {
    switch (update.type) {
      case 'updateName':
        result.name = update.name
        break
      case 'updateDescription':
        result.description = update.description || null
        break
      case 'addEntry':
        lorebook.entries.push(update.entry)
        result.entries = lorebook.entries
        break
      case 'updateEntry':
        if (update.index >= lorebook.entries.length) {
          return { error: `Updating index out of range: ${update.index}` }
        }
        lorebook.entries[update.index] = update.entry
        result.entries = lorebook.entries
        break
      case 'removeEntry':
        if (update.index >= lorebook.entries.length) {
          return { error: `Removing index out of range: ${update.index}` }
        }
        lorebook.entries.splice(update.index, 1)
        result.entries = lorebook.entries
        break
    }
  }

  return { updates: result }
}
