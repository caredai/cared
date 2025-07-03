import { z } from 'zod/v4'

export interface MiscellaneousSettings {
  preferCharacterPrompt: boolean
  preferCharacterJailbreak: boolean

  collapseNewlines: boolean
}

export const miscellaneousSettingsSchema = z.object({
  preferCharacterPrompt: z.boolean(),
  preferCharacterJailbreak: z.boolean(),
  collapseNewlines: z.boolean(),
})

export function fillInMiscellaneousSettingsWithDefaults(
  settings?: MiscellaneousSettings,
): MiscellaneousSettings {
  return (
    settings ?? {
      preferCharacterPrompt: true,
      preferCharacterJailbreak: true,
      collapseNewlines: false,
    }
  )
}
