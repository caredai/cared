import type { ModelPreset } from '../model-preset'
import type { ReducedMessage } from '../types'

export function addCharacterName(
  message: ReducedMessage,
  modelPreset: ModelPreset,
  personaName: string,
  isGroup: boolean,
) {
  message.content.parts = structuredClone(message.content.parts)

  function addPrefix(prefix?: string) {
    if (!prefix) return
    message.content.parts
      .filter((p) => p.type === 'text')
      .map((p) => {
        p.text = `${prefix}: ${p.text}`
      })
  }

  const metadata = message.content.metadata

  switch (modelPreset.characterNameBehavior) {
    case 'none':
      break
    case 'default':
      if (metadata.personaName && metadata.personaName !== personaName) {
        addPrefix(personaName)
      } else if (metadata.characterName && isGroup) {
        addPrefix(metadata.characterName)
      }
      break
    case 'completion':
      // TODO: https://community.openai.com/t/discovered-how-a-name-is-added-to-api-chat-role-messages-and-the-tokens/330016
      addPrefix(metadata.personaName ?? metadata.characterName)
      break
    case 'content':
      addPrefix(metadata.personaName ?? metadata.characterName)
      break
  }

  return message
}
