import { useCallback } from 'react'
import { formatExtensions } from '@tavern/core'

import type { CharacterAdvancedFormValues } from './character-advanced-form'
import { isCharacter, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useUpdateCharacter } from '@/hooks/use-character'
import { CharacterAdvancedForm } from './character-advanced-form'

export function CharacterViewAdvanced() {
  const character = useActiveCharacterOrGroup()

  const updateCharacter = useUpdateCharacter()

  const onSubmit = useCallback(
    async (values: CharacterAdvancedFormValues) => {
      if (!isCharacter(character)) {
        return
      }
      await updateCharacter(character, {
        ...character.content,
        data: {
          ...character.content.data,
          ...values,
          extensions: formatExtensions(values),
        },
      })
    },
    [character, updateCharacter],
  )

  return <CharacterAdvancedForm onChange={onSubmit} />
}
