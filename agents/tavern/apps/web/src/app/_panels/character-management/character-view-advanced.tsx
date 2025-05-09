import { useCallback } from 'react'
import { formatExtensions } from '@tavern/core'

import type { CharacterAdvancedFormValues } from './character-form/advanced'
import { isCharacter, useActiveCharacter } from '@/hooks/use-active-character'
import { useUpdateCharacterDebounce } from '@/lib/character'
import { CharacterAdvancedForm } from './character-form/advanced'

export function CharacterViewAdvanced() {
  const character = useActiveCharacter()

  const updateCharacter = useUpdateCharacterDebounce()

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
