import hash from 'stable-hash'
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
): Partial<LorebookContent> | undefined {
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
        if (lorebook.entries.find((entry) => entry.uid === update.entry.uid)) {
          // Entry with the same UID already exists
          return
        }
        result.entries = [
          ...structuredClone(lorebook.entries),
          update.entry,
        ]
        break
      case 'updateEntry': {
        const index = lorebook.entries.findIndex((entry) => entry.uid === update.uid)
        if (index === -1) {
          // Entry not found
          return
        }
        if (hash(update.entry) === hash(lorebook.entries[index])) {
          // No changes to the entry
          return
        }
        result.entries = structuredClone(lorebook.entries)
        result.entries[index] = update.entry
        break
      }
      case 'removeEntry': {
        const index = lorebook.entries.findIndex((entry) => entry.uid === update.uid)
        if (index === -1) {
          // Entry not found
          return
        }
        result.entries = structuredClone(lorebook.entries)
        result.entries.splice(index, 1)
        break
      }
    }
  }

  return result
}
