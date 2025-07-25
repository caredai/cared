import { z } from 'zod/v4'

export enum ExampleMessagesBehavior {
  Normal = 'normal',
  Keep = 'keep',
  Strip = 'strip',
}

export interface MiscellaneousSettings {
  preferCharacterPrompt: boolean
  preferCharacterJailbreak: boolean

  collapseNewlines: boolean

  exampleMessagesBehavior: ExampleMessagesBehavior
}

export const miscellaneousSettingsSchema = z.object({
  preferCharacterPrompt: z.boolean(),
  preferCharacterJailbreak: z.boolean(),
  collapseNewlines: z.boolean(),
  exampleMessagesBehavior: z.enum(ExampleMessagesBehavior),
})

export function fillInMiscellaneousSettingsWithDefaults(
  settings?: MiscellaneousSettings,
): MiscellaneousSettings {
  return settings
    ? {
        ...settings,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        exampleMessagesBehavior: settings.exampleMessagesBehavior ?? ExampleMessagesBehavior.Normal,
      }
    : {
        preferCharacterPrompt: true,
        preferCharacterJailbreak: true,
        collapseNewlines: false,
        exampleMessagesBehavior: ExampleMessagesBehavior.Normal,
      }
}

export function exampleMessagesBehavior(e: ExampleMessagesBehavior) {
  switch (e) {
    case ExampleMessagesBehavior.Normal:
      return {
        pinExample: false,
        stripExample: false,
      }
    case ExampleMessagesBehavior.Keep:
      return {
        pinExample: true,
        stripExample: false,
      }
    case ExampleMessagesBehavior.Strip:
      return {
        pinExample: false,
        stripExample: true,
      }
  }
}
