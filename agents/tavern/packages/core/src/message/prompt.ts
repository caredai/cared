import type { ModelInfo } from '@ownxai/sdk'
import { toUIMessages } from '@ownxai/sdk'

import type { CharacterCardV2 } from '../character'
import type { ModelPreset } from '../model-preset'
import type { Settings } from '../settings'
import type { ReducedChat, ReducedGroup, ReducedPersona } from '../types'
import type { MessageNode } from './types'
import { substituteMacros } from './substitute'

export interface BuildPromptMessagesParams {
  messages: MessageNode[]
  chat: ReducedChat
  settings: Settings
  modelPreset: ModelPreset
  model: ModelInfo
  persona: ReducedPersona
  character: CharacterCardV2 // next character
  group?: ReducedGroup
}

export function buildPromptMessages(params: BuildPromptMessagesParams) {
  const { messages, chat, settings, modelPreset, model, persona, character, group } = params

  const { evaluateMacros } = substituteMacros({
    messages: messages,
    chat,
    settings,
    modelPreset,
    model,
    persona,
    character,
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
    content: '',
  }))
}
