import { z } from 'zod'

/**
 * Lorebook content interface
 */
export interface LorebookContent {
  /** The name of the book */
  name: string
  /** The description of the book */
  description?: string
  /** The entries of the book */
  entries: LorebookEntry[]
}

/**
 * Lorebook entry interface
 */
export interface LorebookEntry {
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
  /** Indicates if the entry's inclusion is controlled by specific conditions */
  selective: boolean
  /** Defines the logic used to determine if the extension is applied selectively */
  selectiveLogic: LorebookLogic
  addMemo: boolean
  /** Defines the order in which the entry is inserted during processing */
  order: number
  /** Specifies the location where the entry applies */
  position: number
  /** Controls whether the entry is currently disabled */
  disabled: boolean
  /** Prevents the extension from being applied recursively */
  excludeRecursion: boolean
  /** Completely disallows recursive application of the extension */
  preventRecursion: boolean
  /** Will only be checked during recursion */
  delayUntilRecursion: boolean
  /** The chance (between 0 and 1) of the extension being applied */
  probability: number
  /** Determines if the `probability` property is used */
  useProbability: boolean
  /** The maximum level of nesting allowed for recursive application of the extension */
  depth: number
  /** A category or grouping for the extension */
  group: string
  /** Overrides any existing group assignment for the extension */
  groupOverride: boolean
  /** A value used for prioritizing extensions within the same group */
  groupWeight: number
  /** The maximum depth to search for matches when applying the extension */
  scanDepth: number
  /** Controls whether case sensitivity is applied during matching for the extension */
  caseSensitive: boolean
  /** Specifies if only entire words should be matched during extension application */
  matchWholeWords: boolean
  /** Indicates if group weight is considered when selecting extensions */
  useGroupScoring: boolean
  /** An identifier used for automation purposes related to the extension */
  automationId: string
  /** The specific function or purpose of the extension */
  role: number
  sticky?: number
  cooldown?: number
  delay?: number
}

export enum LorebookLogic {
  AND_ANY = 'andAny',
  NOT_ALL = 'notAll',
  NOT_ANY = 'notAny',
  AND_ALL = 'andAll',
}

export const lorebookEntrySchema = z.object({
  keys: z.array(z.string()),
  secondaryKeys: z.array(z.string()).optional(),
  comment: z.string(),
  content: z.string(),
  constant: z.boolean(),
  vectorized: z.boolean(),
  selective: z.boolean(),
  selectiveLogic: z.nativeEnum(LorebookLogic),
  addMemo: z.boolean(),
  order: z.number(),
  position: z.number(),
  disabled: z.boolean(),
  excludeRecursion: z.boolean(),
  preventRecursion: z.boolean(),
  delayUntilRecursion: z.boolean(),
  probability: z.number(),
  useProbability: z.boolean(),
  depth: z.number(),
  group: z.string(),
  groupOverride: z.boolean(),
  groupWeight: z.number(),
  scanDepth: z.number(),
  caseSensitive: z.boolean(),
  matchWholeWords: z.boolean(),
  useGroupScoring: z.boolean(),
  automationId: z.string(),
  role: z.number(),
  sticky: z.number().optional(),
  cooldown: z.number().optional(),
  delay: z.number().optional(),
})

export const lorebookContentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  entries: z.array(lorebookEntrySchema),
})
