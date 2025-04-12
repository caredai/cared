import { z } from 'zod'

import { defaultBackgroundImages } from './defaults'

export interface Settings {
  firstRun: boolean
  background: BackgroundSettings
}

export interface BackgroundSettings {
  fitting: (typeof backgroundFittings)[number]
  active: BackgroundImage
  available: BackgroundImage[]
}

export interface BackgroundImage {
  name: string
  url: string
}

const backgroundImageSchema = z.object({
  name: z.string().min(1).max(64),
  url: z.string(),
})

export const backgroundFittings = ['classic', 'cover', 'contain', 'stretch', 'center'] as const

const backgroundSettingsSchema = z.object({
  fitting: z.enum(backgroundFittings),
  active: backgroundImageSchema,
  available: z.array(backgroundImageSchema),
})

export const settingsSchema = z.object({
  firstRun: z.boolean(),
  background: backgroundSettingsSchema,
})

export function fillInSettingsWithDefaults(settings: Partial<Settings>): Settings {
  return {
    firstRun: settings.firstRun ?? true,
    background: settings.background ?? {
      fitting: 'classic',
      active: defaultBackgroundImages[0]!,
      available: defaultBackgroundImages,
    },
  }
}
