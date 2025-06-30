import type { SubstituteMacrosParams } from '@tavern/core'
import { useCallback, useMemo } from 'react'
import { activateCharactersFromGroup, substituteMacros } from '@tavern/core'

import { useActive } from '@/hooks/use-active'
import { isCharacterGroup } from '@/hooks/use-character-or-group'
import { useMessageTree } from '@/hooks/use-message-tree'

export function useSubstituteMacros() {
  const { settings, modelPreset, model, charOrGroup, persona, chat } = useActive()
  const { branch } = useMessageTree()

  const substituteMacrosParams: SubstituteMacrosParams = useMemo(() => {
    const activatedChars = isCharacterGroup(charOrGroup)
      ? activateCharactersFromGroup({
          group: charOrGroup,
          messages: branch,
        })
      : []

    return {
      messages: branch,
      chat,
      settings,
      modelPreset,
      model,
      persona,
      character: activatedChars.at(0)?.content,
      group: isCharacterGroup(charOrGroup) ? charOrGroup : undefined,
    }
  }, [branch, charOrGroup, chat, model, modelPreset, persona, settings])

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
