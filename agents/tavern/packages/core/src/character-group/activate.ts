import shuffle from 'lodash/shuffle'

import type { MessageNode } from '../message'
import type { ReducedCharacter, ReducedGroup } from '../types'
import { extractExtensions } from '../character'
import { extractAllWords } from '../utils'
import { GroupActivationStrategy } from './types'

export function activateCharactersFromGroup({
  group,
  messages,
  impersonate,
}: {
  group: ReducedGroup
  messages: MessageNode[]
  impersonate?: boolean
}) {
  const metadata = group.metadata
  const activationStrategy = metadata.activationStrategy
  const enabledCharacters = group.characters.filter(
    (c) => !metadata.disabledCharacters?.includes(c.id),
  )

  const lastMessage = messages[messages.length - 1]?.message

  if (!enabledCharacters.length) {
    return []
  }

  const activatedCharacters: ReducedCharacter[] = []

  if (impersonate) {
    const randomIndex = Math.floor(Math.random() * enabledCharacters.length)
    activatedCharacters.push(enabledCharacters[randomIndex]!)
  } else if (activationStrategy === GroupActivationStrategy.Natural) {
    // Prevents the same character from speaking twice
    const bannedChar =
      !metadata.allowSelfResponses && // ...unless allowed to do so
      lastMessage?.role === 'assistant'
        ? enabledCharacters.find((c) => c.id === lastMessage.content.annotations[0].characterId)
        : undefined

    const content = lastMessage?.content.parts
      .map((p) => p.type === 'text' && p.text)
      .filter(Boolean)
      .join('\n')

    // Find mentions (excluding self)
    if (content) {
      for (const word of extractAllWords(content)) {
        for (const char of enabledCharacters) {
          if (char === bannedChar) {
            continue
          }
          if (extractAllWords(char.content.data.name).includes(word)) {
            activatedCharacters.push(char)
            break
          }
        }
      }
    }

    const chattyChars = []
    const shuffledChars = shuffle(enabledCharacters)
    // Activation by talkativeness (in shuffled order)
    for (const char of shuffledChars) {
      if (char === bannedChar) {
        continue
      }
      const talkativeness = extractExtensions(char.content).talkativeness
      const rollValue = Math.random()
      if (talkativeness >= rollValue) {
        activatedCharacters.push(char)
      }
      if (talkativeness > 0) {
        chattyChars.push(char)
      }
    }

    // Pick 1 at random if no one was activated
    if (!activatedCharacters.length) {
      // Try to limit the selected random character to those with talkativeness > 0
      const randomPool = chattyChars.length > 0 ? chattyChars : enabledCharacters
      const randomIndex = Math.floor(Math.random() * randomPool.length)
      activatedCharacters.push(randomPool[randomIndex]!)
    }
  } else if (activationStrategy === GroupActivationStrategy.List) {
    activatedCharacters.push(...enabledCharacters)
  } else if (activationStrategy === GroupActivationStrategy.Manual) {
    activatedCharacters.push(shuffle(enabledCharacters)[0]!)
  } /* if (activationStrategy === GroupActivationStrategy.Pooled) */ else {
    const spokenSinceUser: ReducedCharacter[] = []
    for (const message of messages.reverse()) {
      if (message.message.role === 'user') {
        break
      }
      if (message.message.role === 'assistant') {
        const char = enabledCharacters.find(
          (c) => c.id === message.message.content.annotations[0].characterId,
        )
        if (char) {
          spokenSinceUser.push(char)
        }
      }
    }
    const haveNotSpoken = enabledCharacters.filter((c) => !spokenSinceUser.includes(c))
    if (haveNotSpoken.length) {
      activatedCharacters.push(shuffle(haveNotSpoken)[0]!)
    } else {
      const randomPool =
        lastMessage?.role === 'assistant'
          ? enabledCharacters.filter((c) => c.id !== lastMessage.content.annotations[0].characterId)
          : enabledCharacters
      const randomChar = shuffle(randomPool)[0]
      if (randomChar) {
        activatedCharacters.push(randomChar)
      }
    }
  }

  // De-duplicate characters
  return Array.from(new Set(activatedCharacters))
}
