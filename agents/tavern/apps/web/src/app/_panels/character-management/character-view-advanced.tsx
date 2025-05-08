import type { Character } from '@/lib/character'
import { useCallback, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { extractExtensions, formatExtensions } from '@tavern/core'
import { useForm } from 'react-hook-form'

import type { CharacterAdvancedFormValues } from './character-form/advanced'
import { useUpdateCharacter } from '@/lib/character'
import { CharacterAdvancedForm, characterAdvancedFormSchema } from './character-form/advanced'

export function CharacterViewAdvanced({
  character,
  onClose,
}: {
  character: Character
  onClose: () => void
}) {
  const updateCharacter = useUpdateCharacter(character)

  const data = useMemo(
    () => ({
      ...structuredClone(character.content.data),
      ...extractExtensions(character.content),
    }),
    [character],
  )

  const form = useForm({
    resolver: zodResolver(characterAdvancedFormSchema),
    defaultValues: {
      ...data,
    },
  })

  const onSubmit = useCallback(
    async (updates: CharacterAdvancedFormValues) => {
      await updateCharacter({
        ...character.content,
        data: {
          ...character.content.data,
          ...updates,
          extensions: formatExtensions(updates),
        },
      })
    },
    [character, updateCharacter],
  )

  return <CharacterAdvancedForm data={data} form={form} onSubmit={onSubmit} onClose={onClose} />
}
