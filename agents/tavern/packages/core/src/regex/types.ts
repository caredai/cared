import { z } from 'zod/v4'

import { regexFromString } from './engine'

export interface RegexScript {
  id: string
  name: string
  regex: string
  replaceString: string
  trimStrings: string[]
  placement: RegexPlacement[]
  disabled: boolean
  displayOnly: boolean
  promptOnly: boolean
  runOnEdit: boolean
  substituteMode: RegexSubstituteMode
  minDepth?: number
  maxDepth?: number
}

export enum RegexPlacement {
  // 0
  USER_INPUT = 1,
  AI_OUTPUT = 2,
  SLASH_COMMAND = 3,
  // 4
  LOREBOOK = 5,
  REASONING = 6,
}

export enum RegexSubstituteMode {
  NONE,
  RAW,
  ESCAPED,
}

export const regexScriptSchema = z
  .object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(128),
    regex: z.string().refine((value) => !value || regexFromString(value), {
      message: 'Invalid regular expression',
    }),
    replaceString: z.string(),
    trimStrings: z.array(z.string()),
    placement: z.array(z.enum(RegexPlacement)).refine((arr) => arr.length === new Set(arr).size, {
      message: 'Placement values must be unique',
    }),
    disabled: z.boolean(),
    displayOnly: z.boolean(),
    promptOnly: z.boolean(),
    runOnEdit: z.boolean(),
    substituteMode: z.enum(RegexSubstituteMode),
    minDepth: z.number().int().min(0).step(1).optional(),
    maxDepth: z.number().int().min(0).step(1).optional(),
  })
  .refine(
    (data) => {
      // If both minDepth and maxDepth are defined, minDepth should not be greater than maxDepth
      if (data.minDepth !== undefined && data.maxDepth !== undefined) {
        return data.minDepth <= data.maxDepth
      }
      return true
    },
    {
      message: 'Min depth cannot be greater than max depth',
      path: ['minDepth'],
    },
  )
