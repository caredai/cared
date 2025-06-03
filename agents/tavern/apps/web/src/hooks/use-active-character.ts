import type { Character } from '@/hooks/use-characters'
import type { CharacterGroup } from '@/hooks/use-character-group'
import { useMemo } from 'react'
import { atom, useAtom } from 'jotai'

import { useCharacters } from '@/hooks/use-characters'
import { useCharacterGroups } from '@/hooks/use-character-group'

const activeCharacterIdAtom = atom<string | undefined>(undefined)

export function useSetActiveCharacter() {
  const [, setActiveCharacter] = useAtom(activeCharacterIdAtom)
  return setActiveCharacter
}

export function useActiveCharacter() {
  const { characters } = useCharacters()
  const { groups } = useCharacterGroups()

  const [activeCharacterId] = useAtom(activeCharacterIdAtom)

  return useMemo(() => {
    if (!activeCharacterId) {
      return undefined
    }
    const character = characters.find((c) => c.id === activeCharacterId)
    if (character) {
      return character
    }
    const group = groups.find((g) => g.id === activeCharacterId)
    if (group) {
      return group
    }
  }, [characters, groups, activeCharacterId])
}

export function isCharacterGroup(char?: Character | CharacterGroup): char is CharacterGroup {
  return !!char && 'characters' in char
}

export function isCharacter(char?: Character | CharacterGroup): char is Character {
  return !!char && !isCharacterGroup(char)
}
