import { z } from 'zod/v4'

export interface ModelPresetSettings {
  // Active model preset name; if conflicted, use the first one.
  preset: string
}

export const modelPresetSettingsSchema = z.object({
  preset: z.string(),
})

export function fillInModelPresetSettingsWithDefaults(
  settings?: ModelPresetSettings,
): ModelPresetSettings {
  return (
    settings ?? {
      preset: 'Default',
    }
  )
}
