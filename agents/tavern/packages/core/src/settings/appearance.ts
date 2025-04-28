import { z } from 'zod'

export interface AppearanceSettings {
  leftNavPanelLocked: boolean
  rightNavPanelLocked: boolean

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
  leftNavPanelLocked: z.boolean(),
  rightNavPanelLocked: z.boolean(),
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
      leftNavPanelLocked: false,
      rightNavPanelLocked: false,
      movingUI: undefined,
    }
  )
}
