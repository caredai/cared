import type { SubstituteMacrosParams } from '@tavern/core'
import { useCallback, useMemo } from 'react'
import { substituteMacros } from '@tavern/core'

import { useActivatedCharacters } from '@/hooks/use-activate-characters'
import { useActive } from '@/hooks/use-active'
import { isCharacterGroup } from '@/hooks/use-character-or-group'
import { useMessageTree } from '@/hooks/use-message-tree'

export function useSubstituteMacros() {
  const { settings, modelPreset, model, charOrGroup, persona, chat } = useActive()
  const { branch } = useMessageTree()
  const { nextActivatedCharacter } = useActivatedCharacters()

  const substituteMacrosParams: SubstituteMacrosParams = useMemo(() => {
    const nextChar = nextActivatedCharacter()

    return {
      messages: branch,
      chat,
      settings,
      modelPreset,
      model,
      persona,
      character: nextChar?.content,
      group: isCharacterGroup(charOrGroup) ? charOrGroup : undefined,
    }
  }, [branch, charOrGroup, chat, model, modelPreset, nextActivatedCharacter, persona, settings])

  const evaluateMacros = useCallback(
    (content: string, postProcessFn?: (s: string) => string) => {
      const { evaluateMacros } = substituteMacros(substituteMacrosParams, postProcessFn)
      return evaluateMacros(content)
    },
    [substituteMacrosParams],
  )

  return {
    substituteMacrosParams,
    evaluateMacros,
  }
}
