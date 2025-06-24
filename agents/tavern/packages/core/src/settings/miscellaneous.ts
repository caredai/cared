import { z } from 'zod'

export interface MiscellaneousSettings {
  preferCharacterPrompt: boolean
  preferCharacterJailbreak: boolean
}

export const miscellaneousSettingsSchema = z.object({
  preferCharacterPrompt: z.boolean(),
  preferCharacterJailbreak: z.boolean(),
})

export function fillInMiscellaneousSettingsWithDefaults(settings?: MiscellaneousSettings): MiscellaneousSettings {
  return (
    settings ?? {
      preferCharacterPrompt: true,
      preferCharacterJailbreak: true,
    }
  )
}
