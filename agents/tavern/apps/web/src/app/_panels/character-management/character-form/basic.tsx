import type { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { characterCardV2Schema } from '@tavern/core'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ownxai/ui/components/form'
import { Textarea } from '@ownxai/ui/components/textarea'

export const characterBasicFormSchema = characterCardV2Schema.shape.data.pick({
  name: true,
  creator_notes: true,
  description: true,
  first_mes: true,
})

export type CharacterBasicFormValues = z.infer<typeof characterBasicFormSchema>

export function CharacterBasicFormFields({
  form,
  onBlur,
}: {
  form: UseFormReturn<CharacterBasicFormValues>
  onBlur?: () => void
}) {
  return (
    <>
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
                onBlur={onBlur}
              />
            </FormControl>
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
                onBlur={onBlur}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
