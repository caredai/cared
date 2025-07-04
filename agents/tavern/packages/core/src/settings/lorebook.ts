import { z } from 'zod/v4'

export interface LorebookSettings {
  active: string[] // active lorebooks for all chats

  scanDepth: number
  context: number
  budgetCap: number
  minActivations: number
  maxDepth: number
  maxRecursionSteps: number
  insertionStrategy: 'evenly' | 'character_first' | 'global_first'
  includeNames: boolean
  recursiveScan: boolean
  caseSensitive: boolean
  matchWholeWords: boolean
  useGroupScoring: boolean
  alertOnOverflow: boolean
}

export const lorebookSettingsSchema = z.object({
  active: z.array(z.string()),

  scanDepth: z.number().int().min(0).max(100),
  context: z.number().int().min(1).max(100),
  budgetCap: z.number().int().min(0).max(8192),
  minActivations: z.number().int().min(0).max(100),
  maxDepth: z.number().int().min(0).max(100),
  maxRecursionSteps: z.number().int().min(0).max(10),
  insertionStrategy: z.enum(['evenly', 'character_first', 'global_first']),
  includeNames: z.boolean(),
  recursiveScan: z.boolean(),
  caseSensitive: z.boolean(),
  matchWholeWords: z.boolean(),
  useGroupScoring: z.boolean(),
  alertOnOverflow: z.boolean(),
})

export function fillInLorebookSettingsWithDefaults(settings?: LorebookSettings): LorebookSettings {
  return settings
    ? {
        ...settings,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        active: settings.active ?? [],
      }
    : {
        active: [],
        scanDepth: 2,
        context: 25,
        budgetCap: 0,
        minActivations: 0,
        maxDepth: 0,
        maxRecursionSteps: 0,
        insertionStrategy: 'character_first',
        includeNames: true,
        recursiveScan: true,
        caseSensitive: false,
        matchWholeWords: true,
        useGroupScoring: false,
        alertOnOverflow: false,
      }
}
