import { z } from 'zod/v4'

export interface CharacterSettings {
  favorites: string[] // array of char id or group id
  regexScriptsEnabled?: string[] // array of char id
}

export const characterSettingsSchema = z.object({
  favorites: z.array(z.string()),
  regexScriptsEnabled: z.array(z.string()).optional(),
})

export function fillInCharacterSettingsWithDefaults(settings?: CharacterSettings): CharacterSettings {
  return settings ?? {
    favorites: [],
  }
}
