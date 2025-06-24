import type { Chat, Message, ModelInfo } from '@ownxai/sdk'
import { toUIMessages } from '@ownxai/sdk'

import type { CharacterCardV2 } from '../character'
import type { CharGroupMetadata } from '../character-group'
import type { ModelPreset } from '../model-preset'
import type { PersonaMetadata } from '../persona'
import type { Settings } from '../settings'
import type { Environment } from './macro'
import type { MessageNode } from './types'
import { evaluateMacros as _evaluateMacros } from './macro'

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

export function buildPromptMessages({
  messages,
  branch,
  chat,
  settings,
  modelPreset,
  model,
  persona,
  character,
  group,
}: {
  messages: ReducedMessage[]
  branch: MessageNode[]
  chat: ReducedChat
  settings: Settings
  modelPreset: ModelPreset
  model: ModelInfo
  persona: ReducedPersona
  character: CharacterCardV2 // next character
  group?: {
    characters: ReducedCharacter[]
    metadata: CharGroupMetadata
  }
}) {
  const chatVariables = {
    ...(chat.metadata.custom as any)?.variables,
  }
  const globalVariables = {
    ...settings.variables,
  }

  const uiMessages = toUIMessages(messages as Message[])

  const envFromChar = {
    charPrompt: '',
    charInstruction: '',
    charJailbreak: '',
    description: '',
    personality: '',
    scenario: '',
    persona: '',
    mesExamples: '',
    mesExamplesRaw: '',
    charVersion: '',
    char_version: '',
  }

  const env: Environment = {
    user: persona.name,
    char: character.data.name,
    group: getGroupValue(character, group, true),
    charIfNotGroup: getGroupValue(character, group, true),
    groupNotMuted: getGroupValue(character, group, false),

    ...envFromChar,

    original: '',

    model: model.name,

    input: '',

    chat,
    messages,
    branch,
    modelPreset,
    modelInfo: model,

    chatVariables,
    globalVariables,
  }

  const evaluateMacros = (content: string) => _evaluateMacros(content, env as any)

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

function getGroupValue(
  character: CharacterCardV2,
  group?: {
    characters: ReducedCharacter[]
    metadata: CharGroupMetadata
  },
  includeMuted?: boolean,
) {
  if (!group) {
    return character.data.name
  }

  const including = (x: string) =>
    includeMuted ? true : !group.metadata.disabledCharacters?.includes(x)
  return group.characters
    .filter((c) => including(c.id))
    .map((c) => c.content.data.name)
    .join(', ')
}
