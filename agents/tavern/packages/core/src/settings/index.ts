import { z } from 'zod'

import type { AppearanceSettings } from './appearance'
import type { BackgroundSettings } from './background'
import type { CharacterSettings } from './character'
import type { LorebookSettings } from './lorebook'
import type { MiscellaneousSettings } from './miscellaneous'
import type { ModelSettings } from './model'
import type { ModelPresetSettings } from './model-preset'
import type { PersonaSettings } from './persona'
import type { RegexSettings } from './regex'
import type { SummarySettings } from './summary'
import type { TagsSettings } from './tags'
import type { VariablesSettings } from './variables'
import { appearanceSettingsSchema, fillInAppearanceSettingsWithDefaults } from './appearance'
import { backgroundSettingsSchema, fillInBackgroundSettingsWithDefaults } from './background'
import { characterSettingsSchema, fillInCharacterSettingsWithDefaults } from './character'
import { fillInLorebookSettingsWithDefaults, lorebookSettingsSchema } from './lorebook'
import {
  fillInMiscellaneousSettingsWithDefaults,
  miscellaneousSettingsSchema,
} from './miscellaneous'
import { fillInModelSettingsWithDefaults, modelSettingsSchema } from './model'
import { fillInModelPresetSettingsWithDefaults, modelPresetSettingsSchema } from './model-preset'
import { fillInPersonaSettingsWithDefaults, personaSettingsSchema } from './persona'
import { fillInRegexSettingsWithDefaults, regexSettingsSchema } from './regex'
import { fillInSummarySettingsWithDefaults, summarySettingsSchema } from './summary'
import { fillInTagsSettingsWithDefaults, tagsSettingsSchema } from './tags'
import { fillInVariablesSettingsWithDefaults, variablesSettingsSchema } from './variables'

export * from './background'
export * from './theme'
export * from './model-preset'
export * from './tags'
export * from './model'
export * from './lorebook'
export * from './character'
export * from './persona'
export * from './variables'
export * from './miscellaneous'
export * from './regex'
export * from './summary'

export interface Settings {
  firstRun: boolean
  background: BackgroundSettings
  appearance: AppearanceSettings
  tags: TagsSettings
  modelPreset: ModelPresetSettings
  model: ModelSettings
  lorebook: LorebookSettings
  character: CharacterSettings
  persona: PersonaSettings
  variables: VariablesSettings
  miscellaneous: MiscellaneousSettings
  regex: RegexSettings
  summary: SummarySettings
}

export const settingsSchema = z.object({
  firstRun: z.boolean(),
  background: backgroundSettingsSchema,
  appearance: appearanceSettingsSchema,
  tags: tagsSettingsSchema,
  modelPreset: modelPresetSettingsSchema,
  model: modelSettingsSchema,
  lorebook: lorebookSettingsSchema,
  character: characterSettingsSchema,
  persona: personaSettingsSchema,
  variables: variablesSettingsSchema,
  miscellaneous: miscellaneousSettingsSchema,
  regex: regexSettingsSchema,
  summary: summarySettingsSchema,
})

export function fillInSettingsWithDefaults(settings: Partial<Settings>): Settings {
  return {
    firstRun: settings.firstRun ?? true,
    background: fillInBackgroundSettingsWithDefaults(settings.background),
    appearance: fillInAppearanceSettingsWithDefaults(settings.appearance),
    tags: fillInTagsSettingsWithDefaults(settings.tags),
    modelPreset: fillInModelPresetSettingsWithDefaults(settings.modelPreset),
    model: fillInModelSettingsWithDefaults(settings.model),
    lorebook: fillInLorebookSettingsWithDefaults(settings.lorebook),
    character: fillInCharacterSettingsWithDefaults(settings.character),
    persona: fillInPersonaSettingsWithDefaults(settings.persona),
    variables: fillInVariablesSettingsWithDefaults(settings.variables),
    miscellaneous: fillInMiscellaneousSettingsWithDefaults(settings.miscellaneous),
    regex: fillInRegexSettingsWithDefaults(settings.regex),
    summary: fillInSummarySettingsWithDefaults(settings.summary),
  }
}
