import type { ModelInfo } from '@ownxai/sdk'

import type { MessageNode } from '../message'
import type { ModelPreset } from '../model-preset'
import type { Settings } from '../settings'
import type {
  ReducedCharacter,
  ReducedChat,
  ReducedGroup,
  ReducedLorebook,
  ReducedPersona,
} from '../types'
import { substituteMacros } from '../macro'
import { toUIMessages } from '../message'

export interface BuildPromptMessagesParams {
  messages: MessageNode[]
  chat: ReducedChat
  settings: Settings
  modelPreset: ModelPreset
  model: ModelInfo
  persona: ReducedPersona
  character: ReducedCharacter // the active character (maybe comes from the character group)
  group?: ReducedGroup
  lorebooks: ReducedLorebook[]
}

export function buildPromptMessages(params: BuildPromptMessagesParams) {
  const { messages, chat, settings, modelPreset, model, persona, character, group } = params

  const { evaluateMacros } = substituteMacros({
    messages,
    chat,
    settings,
    modelPreset,
    model,
    persona,
    character: character.content,
    group,
  })

  const uiMessages = toUIMessages(messages.map((node) => node.message))

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
  }))
}
