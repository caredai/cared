import { z } from 'zod/v4'

import { defaultBackgroundImages } from './defaults'

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

export const backgroundSettingsSchema = z.object({
  fitting: z.enum(backgroundFittings),
  active: backgroundImageSchema,
  available: z.array(backgroundImageSchema),
})

export function fillInBackgroundSettingsWithDefaults(
  settings?: BackgroundSettings,
): BackgroundSettings {
  return (
    settings ?? {
      fitting: 'classic',
      active: defaultBackgroundImages[0]!,
      available: defaultBackgroundImages,
    }
  )
}
