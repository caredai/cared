import { z } from 'zod/v4'

export interface PersonaMetadata {
  imageUrl?: string
  description: string
  injectionPosition: PersonaPosition
  depth?: number
  role?: 'system' | 'user' | 'assistant'
}

export enum PersonaPosition {
  None = -1,
  InPrompt = 0,
  ANTop = 1,
  ANBottom = 2,
  AtDepth = 3,
}

export const personaMetadataSchema = z.object({
  imageUrl: z.string().url().optional(),
  description: z.string(),
  injectionPosition: z.enum(PersonaPosition),
  depth: z.number().int().min(0).step(1).optional(),
  role: z.enum(['system', 'user', 'assistant']).optional(),
})
