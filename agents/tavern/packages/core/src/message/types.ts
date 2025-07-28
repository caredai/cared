import type { UIMessage as _UIMessage, UIDataTypes, UITools } from 'ai'
import { z } from 'zod/v4'

import type { Message as _Message } from '@cared/sdk'
import {
  messageContentSchema as _messageContentSchema,
  toUIMessages as _toUIMessages,
} from '@cared/sdk'

export interface MessageMetadata {
  characterId?: string // for 'assistant' role
  characterName?: string // for 'assistant' role; will be used when the character is deleted
  personaId?: string // for 'user' role
  personaName?: string // for 'user' role; will be used when the persona is deleted
  modelId?: string // for 'assistant' role & LLM generated message

  generationSeconds?: number // generation time in seconds

  excluded?: boolean // whether the message should be excluded from the prompt building

  summary?: string // summary of all messages (branched) from the first one up to this one (included)
}

export const messageMetadataSchema = z
  .object({
    characterId: z.string().optional(),
    characterName: z.string().optional(),
    personaId: z.string().optional(),
    personaName: z.string().optional(),
    modelId: z.string().optional(),
    generationSeconds: z.number().optional(),
    excluded: z.boolean().optional(),
    summary: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasCharacter = data.characterId && data.characterName
      const hasPersona = data.personaId && data.personaName
      return hasCharacter ?? hasPersona
    },
    {
      message: 'Either characterId/characterName must exist, or personaId/personaName must exist',
    },
  )

export type MessageContent = z.infer<typeof messageContentSchema>

export const messageContentSchema = _messageContentSchema
  .omit({
    metadata: true,
  })
  .extend({
    metadata: messageMetadataSchema,
  })

export type Message = Omit<_Message, 'content'> & {
  content: MessageContent
}

export type UIMessage<
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS extends UITools = UITools,
> = _UIMessage<MessageMetadata, DATA_PARTS, TOOLS>

export interface MessageNode {
  message: Message
  parent:
    | MessageNode
    // pseudo parent node for root messages
    | {
        message?: undefined
        descendants: MessageNode[]
      }
  descendants: MessageNode[]
}

export function toUIMessages(messages: Pick<Message, 'id' | 'role' | 'content'>[]): UIMessage[] {
  return _toUIMessages(messages) as UIMessage[]
}
