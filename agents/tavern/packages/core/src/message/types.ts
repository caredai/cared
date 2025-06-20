import { z } from 'zod'

import { Message as _Message, messageContentSchema as _messageContentSchema } from '@ownxai/sdk'

export interface MessageAnnotation {
  characterId?: string // for 'assistant' role
  personaId?: string // for 'user' role
  personaName?: string // for 'user' role; will be used when the persona is deleted
  modelId?: string // for 'assistant' role & LLM generated message
}

export const messageAnnotationSchema = z.object({
  characterId: z.string().optional(),
  personaId: z.string().optional(),
  personaName: z.string().optional(),
  modelId: z.string().optional(),
})

export type MessageContent = z.infer<typeof messageContentSchema>

export const messageContentSchema = _messageContentSchema
  .omit({
    annotations: true,
  })
  .extend({
    annotations: z.tuple([messageAnnotationSchema]),
  })

export type Message = Omit<_Message, 'content'> & {
  content: MessageContent
}
