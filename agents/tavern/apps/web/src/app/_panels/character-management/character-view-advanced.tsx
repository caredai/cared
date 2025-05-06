import type { Character } from '@/lib/character'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Portal from '@radix-ui/react-portal'
import { characterCardV2Schema } from '@tavern/core'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@ownxai/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ownxai/ui/components/form'
import { Separator } from '@ownxai/ui/components/separator'
import { Textarea } from '@ownxai/ui/components/textarea'

import { useContentRef } from '@/app/_page/content'
import { CircleSpinner } from '@/components/spinner'

export function CharacterViewAdvanced({
  character,
  onClose,
}: {
  character: Character
  onClose: () => void
}) {
  const contentRef = useContentRef()

  const data = useMemo(() => structuredClone(character.content.data), [character])
  console.log(data)

  const form = useForm({
    resolver: zodResolver(
      characterCardV2Schema.shape.data.pick({
        personality: true,
        scenario: true,
        mes_example: true,
        creator_notes: true,
        system_prompt: true,
        post_history_instructions: true,
      }),
    ),
    defaultValues: {
      ...data,
    },
  })

  return (
    <Portal.Root
      container={contentRef?.current}
      className="absolute w-full z-5000 p-2 flex flex-col gap-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">
          <span className="truncate">{data.name}</span>{' '}
          <span className="text-sm text-muted-foreground">- Advanced Definitions</span>
        </h1>

        <Button
          variant="outline"
          size="icon"
          className="size-6"
          onClick={onClose}
          disabled={form.formState.isSubmitting}
        >
          <XIcon />
        </Button>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

      <Form {...form}>
        <form className="flex flex-col gap-4">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center [&[data-state=open]_svg]:rotate-180">
                <h2 className="text-lg font-medium">Prompt Overrides</h2>

                <Button type="button" variant="outline" size="icon" className="size-6">
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="system_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Prompt</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="post_history_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post-History Instructions</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-center gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <CircleSpinner />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Portal.Root>
  )
}
