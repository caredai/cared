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
        uid: z.number().int().min(0),
        entry: lorebookEntrySchema,
      }),
      z.object({
        type: z.literal('removeEntry'),
        uid: z.number().int().min(0),
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
      case 'updateEntry': {
        const index = lorebook.entries.findIndex(entry => entry.uid === update.uid)
        if (index === -1) {
          return { error: `Entry with uid ${update.uid} not found` }
        }
        lorebook.entries[index] = update.entry
        result.entries = lorebook.entries
        break
      }
      case 'removeEntry': {
        const index = lorebook.entries.findIndex(entry => entry.uid === update.uid)
        if (index === -1) {
          return { error: `Entry with uid ${update.uid} not found` }
        }
        lorebook.entries.splice(index, 1)
        result.entries = lorebook.entries
        break
      }
    }
  }

  return { updates: result }
}
