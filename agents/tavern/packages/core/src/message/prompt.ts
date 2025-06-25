import type { Chat, Message, ModelInfo } from '@ownxai/sdk'
import { toUIMessages } from '@ownxai/sdk'

import type { CharacterCardV2 } from '../character'
import type { CharGroupMetadata } from '../character-group'
import type { ModelPreset } from '../model-preset'
import type { PersonaMetadata } from '../persona'
import type { Settings } from '../settings'
import type { MessageNode } from './types'
import { substituteParams } from './substitute'

export type ReducedChat = Pick<Chat, 'id' | 'metadata' | 'createdAt'>
export type ReducedMessage = Pick<Message, 'id' | 'role' | 'content' | 'createdAt'>

export interface ReducedPersona {
  id: string
  name: string
  metadata: PersonaMetadata
}

export interface ReducedCharacter {
  id: string
  content: CharacterCardV2
}

export interface ReducedGroup {
  characters: ReducedCharacter[]
  metadata: CharGroupMetadata
}

export interface BuildPromptMessagesParams {
  messages: ReducedMessage[]
  branch: MessageNode[]
  chat: ReducedChat
  settings: Settings
  modelPreset: ModelPreset
  model: ModelInfo
  persona: ReducedPersona
  character: CharacterCardV2 // next character
  group?: ReducedGroup
}

export function buildPromptMessages(params: BuildPromptMessagesParams) {
  const { messages, branch, chat, settings, modelPreset, model, persona, character, group } = params

  const { evaluateMacros } = substituteParams({
    messages,
    branch,
    chat,
    settings,
    modelPreset,
    model,
    persona,
    character,
    group,
  })

  const uiMessages = toUIMessages(messages as Message[])

  return uiMessages.map((msg) => ({
    ...msg,
    parts: msg.parts.map((p) => {
      if (p.type === 'text') {
        return {
          ...p,
          text: evaluateMacros(p.text),
        }
      }
      return p
    }),
    content: '',
  }))
}
