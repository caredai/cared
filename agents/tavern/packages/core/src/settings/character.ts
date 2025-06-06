import { z } from 'zod'

export interface CharacterSettings {
  favorites: string[] // array of char id or group id
}

export const characterSettingsSchema = z.object({
  favorites: z.array(z.string()),
})

export function fillInCharacterSettingsWithDefaults(settings?: CharacterSettings): CharacterSettings {
  return settings ?? {
    favorites: [],
  }
}
