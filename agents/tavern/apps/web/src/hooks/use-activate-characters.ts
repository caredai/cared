import type { ReducedCharacter } from '@tavern/core'
import { useCallback, useEffect, useRef } from 'react'
import { activateCharactersFromGroup } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import { useAtomCallback } from 'jotai/utils'

import { isCharacter, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useActiveChat } from '@/hooks/use-chat'
import { useMessageTree } from '@/hooks/use-message-tree'

type CharacterAccessed = ReducedCharacter & {
  accessed?: boolean
}

const activatedCharactersAtom = atom<CharacterAccessed[]>([])

export function useActivateCharacters() {
  const { activeChat: chat } = useActiveChat()
  const charOrGroup = useActiveCharacterOrGroup()
  const { branch } = useMessageTree()

  const [, setActivatedCharacters] = useAtom(activatedCharactersAtom)

  const activateCharacters = useCallback(() => {
    if (!charOrGroup) {
      setActivatedCharacters([])
      return
    }
    const chars = isCharacter(charOrGroup)
      ? [charOrGroup]
      : activateCharactersFromGroup({
          group: charOrGroup,
          messages: branch,
          impersonate: false, // TODO
        })
    setActivatedCharacters(chars)
  }, [branch, charOrGroup, setActivatedCharacters])

  const lastStateRef = useRef<{
    chatId?: string
    charIds: string[]
  }>({
    charIds: [],
  })

  useEffect(() => {
    const state = {
      chatId: chat?.id,
      charIds: !charOrGroup
        ? []
        : isCharacter(charOrGroup)
          ? [charOrGroup.id]
          : charOrGroup.characters.map((c) => c.id),
    }
    if (
      state.chatId !== lastStateRef.current.chatId ||
      state.charIds.length !== lastStateRef.current.charIds.length ||
      state.charIds.some((id, i) => id !== lastStateRef.current.charIds[i])
    ) {
      lastStateRef.current = state
      activateCharacters()
    }
  }, [chat, charOrGroup, activateCharacters])
}

export function useActivatedCharacters() {
  const charOrGroup = useActiveCharacterOrGroup()
  const { branch } = useMessageTree()

  const [activatedCharacters, setActivatedCharacters] = useAtom(activatedCharactersAtom)

  const readActivatedCharacters = useAtomCallback(
    useCallback((get) => {
      return get(activatedCharactersAtom)
    }, []),
  )

  const activateCharacters = useCallback(() => {
    if (!charOrGroup) {
      setActivatedCharacters([])
      return
    }
    const chars = isCharacter(charOrGroup)
      ? [charOrGroup]
      : activateCharactersFromGroup({
          group: charOrGroup,
          messages: branch,
          impersonate: false, // TODO
        })
    setActivatedCharacters(chars)
  }, [branch, charOrGroup, setActivatedCharacters])

  const nextActivatedCharacter = useCallback(
    (reset?: boolean) => {
      let nextChar = readActivatedCharacters().find((c) => !c.accessed)
      if (reset || !nextChar) {
        activateCharacters()

        nextChar = readActivatedCharacters().find((c) => !c.accessed)
        if (!nextChar) {
          return
        }
      }

      const { accessed: _, ...char } = nextChar
      return char
    },
    [activateCharacters, readActivatedCharacters],
  )

  const advanceActivatedCharacter = useCallback(() => {
    const chars = readActivatedCharacters()
    const index = chars.findIndex((c) => !c.accessed)
    if (index < 0) {
      return false
    }
    setActivatedCharacters([
      ...chars.slice(0, index),
      { ...chars[index]!, accessed: true },
      ...chars.slice(index + 1),
    ])
    return index < chars.length - 1 // whether there's a next character
  }, [readActivatedCharacters, setActivatedCharacters])

  return {
    activatedCharacters,
    nextActivatedCharacter,
    advanceActivatedCharacter,
  }
}
