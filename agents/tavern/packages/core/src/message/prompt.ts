import type { Message as _Message, ModelInfo } from '@ownxai/sdk'
import { toUIMessages } from '@ownxai/sdk'

import type { CharacterCardV2 } from '../character'
import type { CharGroupMetadata } from '../character-group'
import type { ModelPreset } from '../model-preset'
import type { Settings } from '../settings'

export type ReducedMessage = Pick<_Message, 'id' | 'role' | 'content' | 'createdAt'>

export function buildPromptMessages({
  messages,
  settings,
  modelPreset,
  model,
  character,
  group,
}: {
  messages: ReducedMessage[]
  settings: Settings
  modelPreset: ModelPreset
  model: ModelInfo
  character?: CharacterCardV2
  group?: {
    characters: CharacterCardV2[]
    metadata: CharGroupMetadata
  }
}) {
  const uiMessages = toUIMessages(messages as _Message[])

  return uiMessages.map((msg) => ({ ...msg, content: '' }))
}
