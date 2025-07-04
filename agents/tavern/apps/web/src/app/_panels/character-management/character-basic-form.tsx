import type { RefObject } from 'react'
import type { z } from 'zod/v4'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { characterCardV2Schema } from '@tavern/core'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@ownxai/ui/components/button'
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

import { isCharacter, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useTextTokens } from '@/hooks/use-tokenizer'
import { useIsCreateCharacter } from './hooks'

export const characterBasicFormSchema = characterCardV2Schema.shape.data.pick({
  name: true,
  creator_notes: true,
  description: true,
  first_mes: true,
  alternate_greetings: true,
})

export type CharacterBasicFormValues = z.infer<typeof characterBasicFormSchema>

export const defaultCharacterBasicFormValues: CharacterBasicFormValues = {
  name: '',
  creator_notes: '',
  description: '',
  first_mes: '',
  alternate_greetings: [],
}

export function CharacterBasicForm({
  onChange,
  ref,
}: {
  onChange?: (values: CharacterBasicFormValues) => void
  ref?: RefObject<(() => Promise<CharacterBasicFormValues | false>) | null>
}) {
  const [showAlternateGreetings, setShowAlternateGreetings] = useState(false)
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
              <div className="flex items-center justify-between">
                <FormLabel className="text-lg">First message</FormLabel>
                <Button
                  type="button"
                  variant={showAlternateGreetings ? 'default' : 'outline'}
                  size="sm"
                  className="px-1 h-6"
                  onClick={() => setShowAlternateGreetings(!showAlternateGreetings)}
                >
                  Alt. Greetings
                </Button>
              </div>
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

        {showAlternateGreetings && (
          <FormField
            control={form.control}
            name="alternate_greetings"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-lg">Alternate Greetings</FormLabel>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          field.onChange([...field.value, ''])

                          const values = await getValues()
                          if (values) {
                            onChange?.(values)
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    {field.value.length === 0 ? (
                      <p className="text-sm text-muted-foreground mb-2">
                        No alternate greetings yet
                      </p>
                    ) : (
                      field.value.map((greeting, index) => (
                        <GreetingItem
                          key={index}
                          index={index}
                          value={greeting}
                          onChange={(newValue) => {
                            const newGreetings = [...field.value]
                            newGreetings[index] = newValue
                            field.onChange(newGreetings)
                          }}
                          onDelete={async () => {
                            const newGreetings = field.value.filter((_, i) => i !== index)
                            field.onChange(newGreetings)

                            const values = await getValues()
                            if (values) {
                              onChange?.(values)
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  )
}

function GreetingItem({
  value,
  onChange,
  onDelete,
  index,
}: {
  value: string
  onChange: (value: string) => void
  onDelete: () => void
  index: number
}) {
  const tokens = useTextTokens(value)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-sm">Alternate Greeting #{index + 1}</FormLabel>
        <Button type="button" variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-30"
        placeholder="Alternate greetings will be randomly selected along with the first message when starting a new chat."
      />
      <FormDescription className="text-right">Tokens: {tokens ?? 0}</FormDescription>
    </div>
  )
}
