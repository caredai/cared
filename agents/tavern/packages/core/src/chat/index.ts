import { z } from 'zod/v4'

import type { TimedEffects } from '../lorebook'
import { timedEffectsSchema } from '../lorebook'

export interface ChatMetadata {
  variables?: Record<string, any>
  scenario?: string
  lorebookTimedEffects?: TimedEffects
}

export const chatMetadataSchema = z.object({
  variables: z.record(z.string(), z.any()).optional(),
  scenario: z.string().optional(),
  lorebookTimedEffects: timedEffectsSchema.optional(),
})
