import { z } from 'zod/v4'

export interface TimedEffect {
  hash: string
  start: number
  end: number
  protected: boolean
}

export interface TimedEffects {
  sticky: Record<string, TimedEffect> // lorebook entry key => sticky number
  cooldown: Record<string, TimedEffect> // lorebook entry key => cooldown number
}

export const timedEffectSchema = z.object({
  hash: z.string(),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  protected: z.boolean(),
})

export const timedEffectsSchema = z.object({
  sticky: z.record(z.string(), timedEffectSchema),
  cooldown: z.record(z.string(), timedEffectSchema),
})

export class TimedEffectsManager {
  constructor(private chatHistoryLength: number) {
  }
}
