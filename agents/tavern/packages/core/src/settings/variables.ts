import {z} from 'zod'

export type VariablesSettings = Record<string, any>

export const variablesSettingsSchema = z.record(z.any())

export function fillInVariablesSettingsWithDefaults(settings?: VariablesSettings): VariablesSettings {
  return settings ?? {}
}
