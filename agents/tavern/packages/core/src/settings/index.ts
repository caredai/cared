import { z } from 'zod'

import type { AppearanceSettings } from './appearance'
import type { BackgroundSettings } from './background'
import type { ModelPresetSettings } from './model-preset'
import type { TagsSettings } from './tags'
import { appearanceSettingsSchema, fillInAppearanceSettingsWithDefaults } from './appearance'
import { backgroundSettingsSchema, fillInBackgroundSettingsWithDefaults } from './background'
import { fillInModelPresetSettingsWithDefaults, modelPresetSettingsSchema } from './model-preset'
import { fillInTagsSettingsWithDefaults, tagsSettingsSchema } from './tags'

export * from './background'
export * from './theme'
export * from './model-preset'
export * from './tags'

export interface Settings {
  firstRun: boolean
  background: BackgroundSettings
  appearance: AppearanceSettings
  tags: TagsSettings
  modelPreset: ModelPresetSettings
}

export const settingsSchema = z.object({
  firstRun: z.boolean(),
  background: backgroundSettingsSchema,
  appearance: appearanceSettingsSchema,
  tags: tagsSettingsSchema,
  modelPreset: modelPresetSettingsSchema,
})

export function fillInSettingsWithDefaults(settings: Partial<Settings>): Settings {
  return {
    firstRun: settings.firstRun ?? true,
    background: fillInBackgroundSettingsWithDefaults(settings.background),
    appearance: fillInAppearanceSettingsWithDefaults(settings.appearance),
    tags: fillInTagsSettingsWithDefaults(settings.tags),
    modelPreset: fillInModelPresetSettingsWithDefaults(settings.modelPreset),
  }
}
