import type { RefObject } from 'react'
import type { z } from 'zod'
import { useCallback, useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { characterCardV2Schema } from '@tavern/core'
import { useForm } from 'react-hook-form'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import { Textarea } from '@ownxai/ui/components/textarea'

import { isCharacter, useActiveCharacterOrGroup } from '@/hooks/use-active-character-or-group'
import { useTextTokens } from '@/hooks/use-tokenizer'
import { useIsCreateCharacter } from './hooks'

export const characterBasicFormSchema = characterCardV2Schema.shape.data.pick({
  name: true,
  creator_notes: true,
  description: true,
  first_mes: true,
})

export type CharacterBasicFormValues = z.infer<typeof characterBasicFormSchema>

export const defaultCharacterBasicFormValues: CharacterBasicFormValues = {
  name: '',
  creator_notes: '',
  description: '',
  first_mes: '',
}

export function CharacterBasicForm({
  onChange,
  ref,
}: {
  onChange?: (values: CharacterBasicFormValues) => void
  ref?: RefObject<(() => Promise<CharacterBasicFormValues | false>) | null>
}) {
  const character = useActiveCharacterOrGroup()

  const isCreateCharacter = useIsCreateCharacter()

  const defaultValues = useMemo(
    () =>
      !isCreateCharacter && isCharacter(character)
        ? {
            ...structuredClone(character.content.data),
          }
        : defaultCharacterBasicFormValues,
    [character, isCreateCharacter],
  )

  useEffect(() => {
    onChange?.(defaultValues)
  }, [onChange, defaultValues])

  const form = useForm({
    resolver: zodResolver(characterBasicFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const descriptionTokens = useTextTokens(form.watch('description'))
  const firstMessageTokens = useTextTokens(form.watch('first_mes'))

  const getValues = useCallback(async () => {
    return (await form.trigger()) && form.getValues()
  }, [form])

  useEffect(() => {
    if (ref) {
      ref.current = getValues
    }
  }, [ref, getValues])

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onBlur={async () => {
          const values = await getValues()
          if (values) {
            onChange?.(values)
          }
        }}
      >
        {isCreateCharacter && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Character Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Name this character" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isCreateCharacter && (
          <FormField
            control={form.control}
            name="creator_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Creator's Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} readOnly className="h-30 cursor-default" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="h-80"
                  placeholder="Describe your character's physical and mental traits here."
                />
              </FormControl>
              <FormDescription className="text-right">
                Tokens: {descriptionTokens ?? 0}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="first_mes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">First message</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="h-30"
                  placeholder="This will be the first message from the character that starts every chat."
                />
              </FormControl>
              <FormDescription className="text-right">
                Tokens: {firstMessageTokens ?? 0}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
