import { z } from 'zod/v4'

import type { TimedEffects } from '../lorebook'
import { timedEffectsSchema } from '../lorebook'

export interface ChatMetadata {
  lorebookTimedEffects?: TimedEffects
}

export const chatMetadataSchema = z.object({
  lorebookTimedEffects: timedEffectsSchema.optional(),
})
