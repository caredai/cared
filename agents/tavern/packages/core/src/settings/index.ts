import { z } from 'zod'

import type { BackgroundSettings } from './background'
import { backgroundSettingsSchema, fillInBackgroundSettingsWithDefaults } from './background'

export * from './background'
export * from './theme'
export * from './model-preset'

export interface Settings {
  firstRun: boolean
  background: BackgroundSettings
}

export const settingsSchema = z.object({
  firstRun: z.boolean(),
  background: backgroundSettingsSchema,
})

export function fillInSettingsWithDefaults(settings: Partial<Settings>): Settings {
  return {
    firstRun: settings.firstRun ?? true,
    background: fillInBackgroundSettingsWithDefaults(settings.background),
  }
}
