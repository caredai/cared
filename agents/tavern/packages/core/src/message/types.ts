import {z} from 'zod'

export interface MessageMetadata {
  characterId?: string // for 'assistant' role
  personaName?: string // for 'user' role
  modelId?: string
}

export const messageMetadataSchema = z.object({
  characterId: z.string().optional(),
  personaName: z.string().optional(),
  modelId: z.string().optional(),
})
