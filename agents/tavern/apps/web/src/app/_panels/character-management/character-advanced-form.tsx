import type { RefObject } from 'react'
import type { z } from 'zod'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Portal from '@radix-ui/react-portal'
import {
  characterCardV2ExtensionsSchema,
  characterCardV2Schema,
  extractExtensions,
} from '@tavern/core'
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
  FormDescription,
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

import { isCharacter, useActiveCharacterOrGroup } from '@/hooks/use-character-or-group'
import { useContentAreaRef, useIsShowCharacterAdvancedView } from '@/hooks/use-show-in-content-area'
import { useTextTokens } from '@/hooks/use-tokenizer'
import { useIsCreateCharacter } from './hooks'

export const characterAdvancedFormSchema = characterCardV2Schema.shape.data
  .pick({
    name: true,
    personality: true,
    scenario: true,
    mes_example: true,
    creator_notes: true,
    system_prompt: true,
    post_history_instructions: true,
    tags: true,
    creator: true,
    character_version: true,
  })
  .merge(characterCardV2ExtensionsSchema)

export type CharacterAdvancedFormValues = z.infer<typeof characterAdvancedFormSchema>

export const defaultCharacterAdvancedFormValues: CharacterAdvancedFormValues = {
  name: '',
  personality: '',
  scenario: '',
  mes_example: '',
  creator_notes: '',
  system_prompt: '',
  post_history_instructions: '',
  tags: [],
  creator: '',
  character_version: '',
  ...extractExtensions({
    // @ts-ignore
    data: {
      extensions: {},
    },
  }),
}

export function CharacterAdvancedForm({
  onChange,
  ref,
}: {
  onChange?: (values: CharacterAdvancedFormValues) => void
  ref?: RefObject<(() => Promise<CharacterAdvancedFormValues | false>) | null>
}) {
  const { isShowCharacterAdvancedView, setIsShowCharacterAdvancedView } =
    useIsShowCharacterAdvancedView()
  const isCreateCharacter = useIsCreateCharacter()
  const character = useActiveCharacterOrGroup()

  const defaultValues = useMemo(
    () =>
      !isCreateCharacter && isCharacter(character)
        ? {
            ...structuredClone(character.content.data),
            ...extractExtensions(character.content),
          }
        : defaultCharacterAdvancedFormValues,
    [character, isCreateCharacter],
  )

  useEffect(() => {
    onChange?.(defaultValues)
  }, [onChange, defaultValues])

  const form = useForm({
    resolver: zodResolver(characterAdvancedFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const getValues = useCallback(async () => {
    return (await form.trigger()) && form.getValues()
  }, [form])

  useEffect(() => {
    if (ref) {
      ref.current = getValues
    }
  }, [ref, getValues])

  const { contentAreaRef } = useContentAreaRef()

  const [tagsInput, setTagsInput] = useState('')
  const [depthInput, setDepthInput] = useState('')
  useEffect(() => {
    setTagsInput(defaultValues.tags.join(', '))
    setDepthInput(defaultValues.depth_prompt_depth.toString())
  }, [defaultValues])

  const systemPromptTokens = useTextTokens(form.watch('system_prompt'))
  const postHistoryTokens = useTextTokens(form.watch('post_history_instructions'))
  const personalityTokens = useTextTokens(form.watch('personality'))
  const scenarioTokens = useTextTokens(form.watch('scenario'))
  const characterNoteTokens = useTextTokens(form.watch('depth_prompt_prompt'))
  const dialogueExampleTokens = useTextTokens(form.watch('mes_example'))

  if (!isShowCharacterAdvancedView || (!isCreateCharacter && !isCharacter(character))) {
    return null
  }

  return (
    <Portal.Root
      container={contentAreaRef?.current}
      className="absolute w-full h-full z-5000 flex flex-col gap-6 p-2 overflow-y-auto bg-background border border-border rounded-lg shadow-lg"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">
          <span className="truncate">
            {isCreateCharacter ? 'Create Character' : defaultValues.name}
          </span>{' '}
          <span className="text-md text-muted-foreground">- Advanced Definitions</span>
        </h1>

        <Button
          variant="outline"
          size="icon"
          className="size-6"
          onClick={() => setIsShowCharacterAdvancedView(false)}
          disabled={form.formState.isSubmitting}
        >
          <XIcon />
        </Button>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-ring/50 to-transparent" />

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
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center [&[data-state=open]_svg]:rotate-180 cursor-pointer">
                <h2 className="text-lg font-medium">Prompt Overrides</h2>

                <Button type="button" variant="outline" size="icon" className="size-6">
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 p-[1px]">
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
                    <FormDescription className="text-right">
                      Tokens: {systemPromptTokens ?? 0}
                    </FormDescription>
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
                    <FormDescription className="text-right">
                      Tokens: {postHistoryTokens ?? 0}
                    </FormDescription>
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
                <FormDescription className="text-right">
                  Tokens: {personalityTokens ?? 0}
                </FormDescription>
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
                <FormDescription className="text-right">
                  Tokens: {scenarioTokens ?? 0}
                </FormDescription>
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
                  <FormDescription className="text-right">
                    Tokens: {characterNoteTokens ?? 0}
                  </FormDescription>
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
                      <Input
                        type="number"
                        min={0}
                        max={999}
                        step={1}
                        value={depthInput}
                        onChange={(e) => {
                          setDepthInput(e.target.value)
                        }}
                        onBlur={() => {
                          const numValue = parseInt(depthInput)
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 999) {
                            setDepthInput(numValue.toString())
                            field.onChange(numValue)
                          } else {
                            // Reset to previous valid value if invalid
                            setDepthInput(field.value.toString())
                          }
                        }}
                      />
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
                <FormDescription className="text-right">
                  Tokens: {dialogueExampleTokens ?? 0}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Portal.Root>
  )
}
