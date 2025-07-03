import {z} from 'zod/v4'

export type VariablesSettings = Record<string, any>

export const variablesSettingsSchema = z.record(z.string(), z.any())

export function fillInVariablesSettingsWithDefaults(settings?: VariablesSettings): VariablesSettings {
  return settings ?? {}
}
