import type { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { useEffect, useState } from 'react'
import * as Portal from '@radix-ui/react-portal'
import { characterCardV2ExtensionsSchema, characterCardV2Schema } from '@tavern/core'
import { ChevronDownIcon, XIcon } from 'lucide-react'

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
import { Input } from '@ownxai/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Separator } from '@ownxai/ui/components/separator'
import { Slider } from '@ownxai/ui/components/slider'
import { Textarea } from '@ownxai/ui/components/textarea'

import { useContentRef } from '@/app/_page/content'
import { CircleSpinner } from '@/components/spinner'

export const characterAdvancedFormSchema = characterCardV2Schema.shape.data
  .pick({
    name: true,
    personality: true,
    scenario: true,
    mes_example: true,
    creator_notes: true,
    system_prompt: true,
    post_history_instructions: true,
    alternate_greetings: true,
    tags: true,
    creator: true,
    character_version: true,
  })
  .merge(characterCardV2ExtensionsSchema)

export type CharacterAdvancedFormValues = z.infer<typeof characterAdvancedFormSchema>

export function CharacterAdvancedForm({
  forCreate = false,
  data,
  form,
  onSubmit,
  onClose,
}: {
  forCreate?: boolean
  data: CharacterAdvancedFormValues
  form: UseFormReturn<CharacterAdvancedFormValues>
  onSubmit: (updates: CharacterAdvancedFormValues) => Promise<void>
  onClose: () => void
}) {
  const contentRef = useContentRef()

  const [tagsInput, setTagsInput] = useState('')
  useEffect(() => {
    setTagsInput(data.tags.join(', '))
  }, [data])

  return (
    <Portal.Root
      container={contentRef?.current}
      className="absolute w-full h-full z-5000 flex flex-col gap-6 p-2 overflow-y-auto bg-background border border-border rounded-lg shadow-lg"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">
          <span className="truncate">{forCreate ? 'Create Character' : data.name}</span>{' '}
          <span className="text-md text-muted-foreground">- Advanced Definitions</span>
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
        <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center [&[data-state=open]_svg]:rotate-180 cursor-pointer">
                <h2 className="text-lg font-medium">Prompt Overrides</h2>

                <Button type="button" variant="outline" size="icon" className="size-6">
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2">
              <FormField
                control={form.control}
                name="system_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any content here will replace the default main prompt used for this character. You can insert {{original}} anywhere to include the default prompt from system settings."
                      />
                    </FormControl>
                    <FormMessage />
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
                      <Textarea
                        {...field}
                        placeholder="Any content here will replace the default post-history instructions used for this character. You can insert {{original}} anywhere to include the default prompt from system settings."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center [&[data-state=open]_svg]:rotate-180 cursor-pointer">
                <h2 className="text-lg font-medium">
                  Creator's Metadata{' '}
                  <span className="text-sm text-muted-foreground">(Not sent with the prompts)</span>
                </h2>

                <Button type="button" variant="outline" size="icon" className="size-6">
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden grid grid-cols-2 gap-2 p-[1px]">
              <FormField
                control={form.control}
                name="creator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="(Character creator's name / contact info)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="character_version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Version</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="(If you want to track character versions)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creator_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator's Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-25"
                        placeholder="(Describe the character, give usage tips, or list the chat models it has been tested on. This will be displayed in the character list.)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Embedded Tags{' '}
                      <span className="text-sm text-muted-foreground">(Separated by comma)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        value={tagsInput}
                        onChange={(e) => {
                          setTagsInput(e.target.value)
                        }}
                        onBlur={() => {
                          const tags = tagsInput
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter((tag) => tag.length > 0)
                          setTagsInput(tags.join(', '))
                          field.onChange(tags)
                        }}
                        className="min-h-25"
                        placeholder="(Input a comma-separated list of tags)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          <FormField
            control={form.control}
            name="personality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">Personality summary</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-25"
                    placeholder="(A brief description of the personality)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scenario"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">Scenario</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-25"
                    placeholder="(Circumstances and context of the interaction)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="depth_prompt_prompt"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-lg font-medium">Character's Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-30"
                      placeholder="(Text to be inserted into chat @ the designated depth and role)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 w-25 mt-1">
              <FormField
                control={form.control}
                name="depth_prompt_depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">@ Depth</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={999} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="depth_prompt_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-6000">
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="talkativeness"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel className="text-lg font-medium">
                  Talkativeness{' '}
                  <span className="text-sm text-muted-foreground">
                    (How often the character speaks in{' '}
                    <span className="text-foreground font-bold">group chats</span>)
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-1">
                    <Slider
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                    <div className="flex justify-between text-xs">
                      <span className="w-12 text-left">Shy</span>
                      <span className="w-12 text-center">Normal</span>
                      <span className="w-12 text-right">Chatty</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mes_example"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Dialogue Example{' '}
                  <span className="text-sm text-muted-foreground">
                    (Important to set the character's writing style)
                  </span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-30"
                    placeholder="(Examples of chat dialog. Begin each example with <START> on a new line.)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-center gap-2 my-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? (
                <>
                  <CircleSpinner />
                  {forCreate ? 'Creating...' : 'Saving...'}
                </>
              ) : forCreate ? (
                'Create'
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
