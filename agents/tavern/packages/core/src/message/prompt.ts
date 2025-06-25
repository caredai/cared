import type { Message, ModelInfo } from '@ownxai/sdk'
import { toUIMessages } from '@ownxai/sdk'

import type { CharacterCardV2 } from '../character'
import type { ModelPreset } from '../model-preset'
import type { Settings } from '../settings'
import type { ReducedChat, ReducedGroup, ReducedMessage, ReducedPersona } from '../types'
import type { MessageNode } from './types'
import { substituteParams } from './substitute'

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
