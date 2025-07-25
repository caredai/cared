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
import { populatePromptMessages } from './populate'

export interface BuildPromptMessagesParams {
  generateType: 'normal' | 'continue' | 'regenerate' | 'impersonate'
  messages: MessageNode[]
  chat: ReducedChat
  settings: Settings
  modelPreset: ModelPreset
  model: ModelInfo
  persona: ReducedPersona
  character: ReducedCharacter // the active character (maybe comes from the character group)
  group?: ReducedGroup
  lorebooks: ReducedLorebook[]
  countTokens: (text: string, modelId?: string) => Promise<number>
  log?: boolean
}

export async function buildPromptMessages(params: BuildPromptMessagesParams) {
  const { messages, chat, settings, modelPreset, model, persona, character, group } = params

  const { evaluateMacros, characterFields } = substituteMacros({
    messages,
    chat,
    settings,
    modelPreset,
    model,
    persona,
    character: character.content,
    group,
  })

  const { modelMessages, promptCollections, updatedTimedEffects } = await populatePromptMessages({
    ...params,
    substituteMacros: evaluateMacros,
    characterFields,
  })

  return {
    promptMessages: modelMessages ?? [],
    promptCollections,
    updatedTimedEffects
  }
}
