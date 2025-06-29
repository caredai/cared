import { z } from 'zod'

import type { RegexScript } from '../regex'
import { regexScriptSchema } from '../regex'

export interface RegexSettings {
  scripts: RegexScript[]
}

export const regexSettingsSchema = z.object({
  scripts: z.array(regexScriptSchema),
})

export function fillInRegexSettingsWithDefaults(settings?: RegexSettings): RegexSettings {
  return (
    settings ?? {
      scripts: [],
    }
  )
}
