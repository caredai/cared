import { z } from 'zod'

import type { Message as _Message } from '@ownxai/sdk'
import { messageContentSchema as _messageContentSchema } from '@ownxai/sdk'

export interface MessageAnnotation {
  characterId?: string // for 'assistant' role
  personaId?: string // for 'user' role
  personaName?: string // for 'user' role; will be used when the persona is deleted
  modelId?: string // for 'assistant' role & LLM generated message
}

export const messageAnnotationSchema = z
  .object({
    characterId: z.string().optional(),
    personaId: z.string().optional(),
    personaName: z.string().optional(),
    modelId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Either characterId exists, or personaId and personaName both exist
      const hasCharacter = data.characterId
      const hasPersonaAndName = data.personaId && data.personaName
      return hasCharacter ?? hasPersonaAndName
    },
    {
      message: 'Either characterId must exist, or personaId and personaName must both exist',
    },
  )

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

export interface MessageNode {
  message: Message
  parent?: MessageNode
  descendants: MessageNode[]
}
