import { z } from 'zod'

import { regexFromString } from './utils'

export interface RegexScript {
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
  WORLD_INFO = 5,
  REASONING = 6,
}

export enum RegexSubstituteMode {
  NONE,
  RAW,
  ESCAPED,
}

export const regexScriptSchema = z.object({
  name: z.string().min(1).max(128),
  regex: z.string().refine((value) => !value || regexFromString(value), {
    message: 'Invalid regular expression',
  }),
  replaceString: z.string(),
  trimStrings: z.array(z.string()),
  placement: z
    .array(z.nativeEnum(RegexPlacement))
    .refine((arr) => arr.length === new Set(arr).size, {
      message: 'Placement values must be unique',
    }),
  disabled: z.boolean(),
  displayOnly: z.boolean(),
  promptOnly: z.boolean(),
  runOnEdit: z.boolean(),
  substituteMode: z.nativeEnum(RegexSubstituteMode),
  minDepth: z.number().optional(),
  maxDepth: z.number().optional(),
})
