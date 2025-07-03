import { z } from 'zod/v4'

export interface ModelSettings {
  languageModel: string
  favoriteLanguageModels: string[]
}

export const modelSettingsSchema = z.object({
  languageModel: z.string(),
  favoriteLanguageModels: z.array(z.string()),
})

export function fillInModelSettingsWithDefaults(settings?: ModelSettings): ModelSettings {
  return (
    settings ?? {
      languageModel: 'openrouter:anthropic/claude-3.7-sonnet',
      favoriteLanguageModels: [],
    }
  )
}
