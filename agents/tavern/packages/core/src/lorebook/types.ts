import { z } from 'zod/v4'

/**
 * Lorebook content interface
 */
export interface LorebookContent {
  /** The name of the book */
  name: string
  /** The description of the book */
  description?: string | null
  /** The entries of the book */
  entries: LorebookEntry[]
}

/**
 * Lorebook entry interface
 */
export interface LorebookEntry {
  /** Unique identifier for the entry */
  uid: number
  /** Controls whether the entry is currently disabled */
  disabled: boolean
  /** An array of primary keys associated with the entry */
  keys: string[]
  /** An array of secondary keys associated with the entry (optional) */
  secondaryKeys?: string[]
  /** A human-readable description or explanation for the entry */
  comment: string
  /** The main content or data associated with the entry */
  content: string
  /** Indicates if the entry's content is fixed and unchangeable */
  constant: boolean
  /** Indicates if the extension is optimized for vectorized processing */
  vectorized: boolean
  /** Defines the logic used to determine if the extension is applied selectively */
  selectiveLogic: SelectiveLogic
  /** Defines the order in which the entry is inserted during processing */
  order: number
  /** Specifies the location where the entry applies */
  position: Position
  /** Prevents the extension from being applied recursively */
  excludeRecursion: boolean
  /** Completely disallows recursive application of the extension */
  preventRecursion: boolean
  /** Will only be checked during recursion */
  delayUntilRecursion: boolean
  /** The chance (between 0 and 1) of the extension being applied */
  probability: number
  /** The maximum level of nesting allowed for recursive application of the extension */
  depth?: number
  /** A category or grouping for the extension */
  group: string
  /** Overrides any existing group assignment for the extension */
  groupOverride: boolean
  /** A value used for prioritizing extensions within the same group */
  groupWeight: number
  /** The entry stays active for N messages after being activated. Stickied entries ignore probability checks on consequent scans until they expire. */
  sticky: number
  /** The entry can't be activated for N messages after being activated. Can be used together with sticky: the entry goes on cooldown when the sticky duration ends. */
  cooldown: number
  /** The entry can't be activated unless there are at least N messages in the chat at the moment of evaluation. */
  delay: number
  /** Defines how many messages in the chat history should be scanned for World Info keys. */
  scanDepth?: number
  /** Controls whether case sensitivity is applied during matching for the extension */
  caseSensitive?: boolean
  /** Specifies if only entire words should be matched during extension application */
  matchWholeWords?: boolean
  /** Indicates if group weight is considered when selecting extensions */
  useGroupScoring?: boolean
  /** An identifier used for automation purposes related to the extension */
  automationId?: string
  /** The specific function or purpose of the extension */
  role?: 'system' | 'user' | 'assistant'
  characterFilter?: {
    isExclude: boolean
    names: string[]
    tags: string[]
  }
  /** Indicates if the entry's inclusion is controlled by specific conditions */
  selective: boolean
  /** Determines if the `probability` property is used */
  useProbability: boolean
  /** Whether the comment should be added to the entry */
  addMemo: boolean
  matchPersonaDescription?: boolean
  matchCharacterDescription?: boolean
  matchCharacterPersonality?: boolean
  matchCharacterDepthPrompt?: boolean
  matchScenario?: boolean
  matchCreatorNotes?: boolean
}

export enum SelectiveLogic {
  AND_ANY = 'andAny',
  NOT_ALL = 'notAll',
  NOT_ANY = 'notAny',
  AND_ALL = 'andAll',
}

export enum Position {
  Before = 0, // Before Char Defs
  After = 1, // After Char Defs
  ANTop = 2, // Top of AN (Author's Note)
  ANBottom = 3, // Bottom of AN
  AtDepth = 4, // @ Depth
  EMTop = 5, // Before Example Messages
  EMBottom = 6, // After Example Messages
}

export const lorebookEntrySchema = z.object({
  uid: z.number().int().min(0),
  disabled: z.boolean(),
  keys: z.array(z.string()),
  secondaryKeys: z.array(z.string()).optional(),
  comment: z.string(),
  content: z.string(),
  constant: z.boolean(),
  vectorized: z.boolean(),
  selectiveLogic: z.nativeEnum(SelectiveLogic),
  order: z.number().int().min(0).step(1),
  position: z.nativeEnum(Position),
  excludeRecursion: z.boolean(),
  preventRecursion: z.boolean(),
  delayUntilRecursion: z.boolean(),
  probability: z.number().int().min(0).max(100).step(1),
  depth: z.number().int().min(0).step(1).optional(),
  group: z.string(),
  groupOverride: z.boolean(),
  groupWeight: z.number().int().min(1).step(1),
  sticky: z.number().int().min(0).step(1),
  cooldown: z.number().int().min(0).step(1),
  delay: z.number().int().min(0).step(1),
  scanDepth: z.number().int().min(0).max(1000).step(1).optional(),
  caseSensitive: z.boolean().optional(),
  matchWholeWords: z.boolean().optional(),
  useGroupScoring: z.boolean().optional(),
  automationId: z.string().optional(),
  role: z.enum(['system', 'user', 'assistant']).optional(),
  characterFilter: z
    .object({
      isExclude: z.boolean(),
      names: z.array(z.string()),
      tags: z.array(z.string()),
    })
    .optional(),
  selective: z.boolean(),
  useProbability: z.boolean(),
  addMemo: z.boolean(),
  matchPersonaDescription: z.boolean().optional(),
  matchCharacterDescription: z.boolean().optional(),
  matchCharacterPersonality: z.boolean().optional(),
  matchCharacterDepthPrompt: z.boolean().optional(),
  matchScenario: z.boolean().optional(),
  matchCreatorNotes: z.boolean().optional(),
})

export const lorebookEntriesSchema = z.array(lorebookEntrySchema).superRefine((entries, ctx) => {
  if (new Set(entries.map((entry) => entry.uid)).size !== entries.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Each entry must have a unique uid',
    })
  }

  return z.NEVER
})
