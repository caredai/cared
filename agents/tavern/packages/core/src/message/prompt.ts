import type { Message } from '@ownxai/sdk'
import {
  buildMessageBranchFromDescendant,
  toUIMessages,
} from '@ownxai/sdk'

import type { CharGroupMetadata } from '../char-group-metadata'
import type { CharacterCardV2 } from '../character'
import type { ModelPreset } from '../model-preset'
import type { Settings } from '../settings'

export function buildPromptMessages({
  allMessages,
  lastMessage,
  settings,
  modelPreset,
  character,
  group,
}: {
  allMessages: Message[]
  lastMessage: Message,
  settings: Settings
  modelPreset: ModelPreset
  character?: CharacterCardV2
  group?: {
    characters: CharacterCardV2[]
    metadata: CharGroupMetadata
  }
}) {
  const messageBranch = buildMessageBranchFromDescendant(allMessages, lastMessage)
  const messages = toUIMessages(messageBranch)

  return messages.map(msg => ({...msg, content: ''}))
}
