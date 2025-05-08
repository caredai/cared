import { useCallback, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { extractExtensions } from '@tavern/core'
import { useForm } from 'react-hook-form'

import { Form } from '@ownxai/ui/components/form'

import { CharacterAdvancedForm, characterAdvancedFormSchema } from './character-form/advanced'
import { CharacterBasicFormFields, characterBasicFormSchema } from './character-form/basic'

export const characterCreateFormSchema = characterBasicFormSchema.merge(characterAdvancedFormSchema)

export function CharacterCreate() {
  const data = useMemo(
    () => ({
      name: '',
      creator_notes: '',
      description: '',
      first_mes: '',
      personality: '',
      scenario: '',
      mes_example: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      ...extractExtensions({
        // @ts-ignore
        data: {
          extensions: {},
        },
      }),
    }),
    [],
  )

  const form = useForm({
    resolver: zodResolver(characterCreateFormSchema),
    defaultValues: data,
  })

  const onSubmit = useCallback(async () => {}, [])

  const [isAdvancedDialogOpen, setIsAdvancedDialogOpen] = useState(false)

  return (
    <div>
      <Form {...form}>
        <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* @ts-ignore */}
          <CharacterBasicFormFields form={form} />
        </form>
      </Form>

      {isAdvancedDialogOpen && (
        <CharacterAdvancedForm
          data={data}
          // @ts-ignore
          form={form}
          onSubmit={onSubmit}
          onClose={() => setIsAdvancedDialogOpen(false)}
        />
      )}
    </div>
  )
}
