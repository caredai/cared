import { z } from 'zod'

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
  return settings
    ? {
        ...settings,
        collapseNewlines:
          typeof settings.collapseNewlines === 'boolean' ? settings.collapseNewlines : true,
      }
    : {
        preferCharacterPrompt: true,
        preferCharacterJailbreak: true,
        collapseNewlines: false,
      }
}
