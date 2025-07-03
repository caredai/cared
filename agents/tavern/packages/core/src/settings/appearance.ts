import { z } from 'zod/v4'

export interface AppearanceSettings {
  modelPresetPanelLocked: boolean
  characterPanelLocked: boolean
  lorebookPanelLocked: boolean
  modelPresetPanelOpen: boolean
  characterPanelOpen: boolean
  lorebookPanelOpen: boolean

  movingUI?:
    | { enabled: false }
    | {
        enabled: true
        state: Record<
          (typeof movingUIPanels)[number] | string,
          {
            top: number
            left: number
            right: number
            bottom: number
            width: number
            height: number
          }
        >
      }
}

const movingUIPanels = ['left-nav-panel', 'right-nav-panel'] as const

export const appearanceSettingsSchema = z.object({
  modelPresetPanelLocked: z.boolean(),
  characterPanelLocked: z.boolean(),
  lorebookPanelLocked: z.boolean(),
  modelPresetPanelOpen: z.boolean(),
  characterPanelOpen: z.boolean(),
  lorebookPanelOpen: z.boolean(),
  movingUI: z
    .discriminatedUnion('enabled', [
      z.object({ enabled: z.literal(false) }),
      z.object({
        enabled: z.literal(true),
        state: z.record(
          z.enum(movingUIPanels),
          z.object({
            top: z.number(),
            left: z.number(),
            right: z.number(),
            bottom: z.number(),
            width: z.number(),
            height: z.number(),
          }),
        ),
      }),
    ])
    .optional(),
})

export function fillInAppearanceSettingsWithDefaults(settings?: AppearanceSettings) {
  return (
    settings ?? {
      modelPresetPanelLocked: false,
      characterPanelLocked: false,
      lorebookPanelLocked: false,
      modelPresetPanelOpen: false,
      characterPanelOpen: false,
      lorebookPanelOpen: false,
      movingUI: undefined,
    }
  )
}
