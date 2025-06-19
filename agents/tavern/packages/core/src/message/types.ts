import {z} from 'zod'

export interface MessageMetadata {
  characterId?: string // for 'assistant' role
  personaId?: string // for 'user' role
  personaName?: string // for 'user' role; will be used when the persona is deleted
  modelId?: string
}

export const messageMetadataSchema = z.object({
  characterId: z.string().optional(),
  personaId: z.string().optional(),
  personaName: z.string().optional(),
  modelId: z.string().optional(),
})
