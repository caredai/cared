import {z} from 'zod'

export interface MessageMetadata {
  characterOrGroupId?: string
  modelId?: string
}

export const messageMetadataSchema = z.object({
  characterOrGroupId: z.string().optional(),
  modelId: z.string().optional(),
})
