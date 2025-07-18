import type { Lorebook } from '@/hooks/use-lorebook'
import type { z } from 'zod/v4'
import { memo, useCallback, useEffect, useState } from 'react'
import { faComments, faPaste, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { zodResolver } from '@hookform/resolvers/zod'
import { lorebookEntrySchema, Position, SelectiveLogic } from '@tavern/core'
import { ChevronDownIcon } from 'lucide-react'
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
import { Input } from '@ownxai/ui/components/input'
import { MultiSelectVirtual } from '@ownxai/ui/components/multi-select-virtual'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Switch } from '@ownxai/ui/components/switch'
import { Textarea } from '@ownxai/ui/components/textarea'
import { cn } from '@ownxai/ui/lib/utils'

import { CheckboxField } from '@/components/checkbox-field'
import { FaButton } from '@/components/fa-button'
import { NumberInput, OptionalNumberInput } from '@/components/number-input'
import { useCharacters } from '@/hooks/use-character'
import { useUpdateLorebook } from '@/hooks/use-lorebook'
import { useTagsSettings } from '@/hooks/use-settings'
import { useTextTokens } from '@/hooks/use-tokenizer'

const selectiveLogicOptions = [
  { value: SelectiveLogic.AND_ANY, label: 'AND ANY' },
  { value: SelectiveLogic.NOT_ALL, label: 'NOT ALL' },
  { value: SelectiveLogic.NOT_ANY, label: 'NOT ANY' },
  { value: SelectiveLogic.AND_ALL, label: 'AND ALL' },
]

const positionOptions = [
  {
    value: 'before-char',
    label: 'Before Character Definitions',
    name: '↑Char',
    position: Position.Before,
  },
  {
    value: 'after-char',
    label: 'After Character Definitions',
    name: '↓Char',
    position: Position.After,
  },
  { value: 'before-an', label: "Before Author's Note", name: '↑AN', position: Position.ANTop },
  { value: 'after-an', label: "After Author's Note", name: '↓AN', position: Position.ANBottom },
  { value: 'before-em', label: 'Before Example Messages', name: '↑EM', position: Position.EMTop },
  { value: 'after-em', label: 'After Example Messages', name: '↓EM', position: Position.EMBottom },
  {
    value: 'at-depth-system',
    label: 'At Depth (⚙️ System)',
    name: '@D ⚙️',
    position: Position.AtDepth,
    role: 'system' as const,
  },
  {
    value: 'at-depth-user',
    label: 'At Depth (👤 User)',
    name: '@D 👤',
    position: Position.AtDepth,
    role: 'user' as const,
  },
  {
    value: 'at-depth-assistant',
    label: 'At Depth (🤖 Assistant)',
    name: '@D 🤖',
    position: Position.AtDepth,
    role: 'assistant' as const,
  },
]

const entryFormSchema = lorebookEntrySchema

export type EntryFormValues = z.infer<typeof entryFormSchema>

type Strategy = 'normal' | 'constant' | 'vectorized'

const strategyOptions = [
  { value: 'normal', label: '🟢 Normal', name: '🟢' },
  { value: 'constant', label: '🔵 Constant', name: '🔵' },
  { value: 'vectorized', label: '🔗 Vectorized', name: '🔗' },
]

export const LorebookEntryItemEdit = memo(function LorebookEntryItemEdit({
  id,
  uid,
  defaultValues,
  maxUid,
  lorebooks,
  open,
  onOpenChange,
}: {
  id: string
  uid: number
  defaultValues: Partial<EntryFormValues>
  maxUid: number
  lorebooks: Lorebook[]
  open?: boolean
  onOpenChange?: (uid: number, open: boolean) => void
}) {
  const updateLorebook = useUpdateLorebook()

  const [secondaryKeys, setSecondaryKeys] = useState<string>(
    defaultValues.secondaryKeys?.join(', ') ?? '',
  )
  const [primaryKeys, setPrimaryKeys] = useState<string>(defaultValues.keys?.join(', ') ?? '')

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const isPositionAtDepth = form.watch('position') === Position.AtDepth

  useEffect(() => {
    form.setValue('depth', isPositionAtDepth ? 4 : undefined)
  }, [isPositionAtDepth, form])

  const handleStrategyChange = useCallback(
    (value: Strategy) => {
      form.setValue('constant', value === 'constant')
      form.setValue('vectorized', value === 'vectorized')
    },
    [form],
  )

  const getStrategyValue = useCallback(() => {
    if (form.watch('constant')) return 'constant'
    if (form.watch('vectorized')) return 'vectorized'
    return 'normal'
  }, [form])

  const handleBlur = useCallback(() => {
    const values = form.getValues()
    const characterFilter = values.characterFilter as Partial<typeof values.characterFilter>
    values.characterFilter =
      characterFilter?.isExclude || characterFilter?.names?.length || characterFilter?.tags?.length
        ? {
            isExclude: characterFilter.isExclude ?? false,
            names: characterFilter.names ?? [],
            tags: characterFilter.tags ?? [],
          }
        : undefined
    const lorebook = lorebooks.find((lorebook) => lorebook.id === id)
    if (!lorebook) return

    const entries = lorebook.entries.map((entry) => (entry.uid === uid ? { ...values } : entry))

    void updateLorebook({
      id,
      entries,
    })
  }, [form, updateLorebook, id, uid, lorebooks])

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const values = form.getValues()
      const characterFilter = values.characterFilter as Partial<typeof values.characterFilter>
      values.characterFilter =
        characterFilter?.isExclude ||
        characterFilter?.names?.length ||
        characterFilter?.tags?.length
          ? {
              isExclude: characterFilter.isExclude ?? false,
              names: characterFilter.names ?? [],
              tags: characterFilter.tags ?? [],
            }
          : undefined
      const newUid = maxUid + 1
      const lorebook = lorebooks.find((lorebook) => lorebook.id === id)
      if (!lorebook) return

      const newEntry = {
        ...values,
        uid: newUid,
      }

      void updateLorebook({
        id,
        entries: [...lorebook.entries, newEntry],
      })
    },
    [form, updateLorebook, id, maxUid, lorebooks],
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const lorebook = lorebooks.find((lorebook) => lorebook.id === id)
      if (!lorebook) return

      void updateLorebook({
        id,
        entries: lorebook.entries.filter((entry) => entry.uid !== uid),
      })
    },
    [updateLorebook, id, uid, lorebooks],
  )

  const contentTokens = useTextTokens(form.watch('content'))

  const { characters } = useCharacters() // Get all characters
  const tagsSettings = useTagsSettings() // Get all tags settings

  const characterNameOptions = characters.map((char) => ({
    value: char.id,
    label: char.content.data.name,
  }))
  const tagNameOptions = tagsSettings.tags.map((tag) => ({
    value: tag.name,
    label: tag.name,
  }))

  return (
    <Form {...form}>
      <form
        className="flex flex-col justify-center p-1 my-0.25 border border-border rounded-md"
        onBlur={handleBlur}
        autoComplete="off"
      >
        <Collapsible open={open} onOpenChange={(open) => onOpenChange?.(uid, open)}>
          <div className="flex flex-wrap md:grid grid-cols-[24px_20px_1fr_52px_72px_60px_60px_60px_24px_24px] items-end md:items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-6 [&[data-state=open]>svg]:rotate-180"
              >
                <ChevronDownIcon className="transition-transform duration-200" />
              </Button>
            </CollapsibleTrigger>

            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="space-y-0 h-5">
                  <FormControl>
                    <Switch
                      checked={!field.value}
                      onCheckedChange={(value) => field.onChange(!value)}
                      className="data-[state=checked]:bg-yellow-700 scale-60 -mx-2"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem className="md:flex-1 space-y-0">
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-7 h-7 px-2 py-0.5 text-sm"
                      placeholder="Comment"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="constant"
              render={() => (
                <FormItem className="w-fit space-y-0">
                  <Select value={getStrategyValue()} onValueChange={handleStrategyChange}>
                    <FormControl>
                      <SelectTrigger className="w-13 h-7 px-1 py-0.5">
                        <SelectValue>
                          {strategyOptions.find((opt) => opt.value === getStrategyValue())?.name}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-6000">
                      {strategyOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={() => (
                <FormItem className="w-fit space-y-0">
                  <FormLabel className="md:hidden text-xs">Position</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const selectedOption = positionOptions.find((opt) => opt.value === value)
                      if (!selectedOption) return
                      form.setValue('position', selectedOption.position)
                      if (selectedOption.position === Position.AtDepth && selectedOption.role) {
                        form.setValue('role', selectedOption.role)
                      } else {
                        form.setValue('role', undefined as any)
                      }
                    }}
                    value={(() => {
                      const pos = form.watch('position')
                      const role = form.watch('role')
                      const found = positionOptions.find(
                        (opt) =>
                          opt.position === pos &&
                          (opt.position === Position.AtDepth ? opt.role === role : true),
                      )
                      return found?.value ?? ''
                    })()}
                  >
                    <FormControl>
                      <SelectTrigger
                        className="w-18 h-7 px-1 py-0.5"
                        title={decodeURI(`
↑Char: Before Character Definitions
↓Char: After Character Definitions
↑EM: Before Example Messages
↓EM: After Example Messages
↑AN: Before Author's Note
↓AN: After Author's Note
@D ⚙️: At Depth (System)
@D 👤: At Depth (User)
@D 🤖: At Depth (Assistant)
                        `)}
                      >
                        <SelectValue placeholder="Select position">
                          {(() => {
                            const pos = form.watch('position')
                            const role = form.watch('role')
                            const found = positionOptions.find(
                              (opt) =>
                                opt.position === pos &&
                                (opt.position === Position.AtDepth ? opt.role === role : true),
                            )
                            return found?.name
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-6000">
                      {positionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depth"
              render={({ field }) => (
                <FormItem className="w-15 space-y-0">
                  <FormLabel className="md:hidden text-xs">Depth</FormLabel>
                  <FormControl>
                    <NumberInput
                      min={0}
                      step={1}
                      value={field.value ?? 4}
                      onChange={(value) => field.onChange(value)}
                      className={cn('h-7 px-2 py-0.5', !isPositionAtDepth && 'invisible')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem className="w-15 space-y-0">
                  <FormLabel className="md:hidden text-xs">Order</FormLabel>
                  <FormControl>
                    <NumberInput min={0} step={1} {...field} className="h-7 px-2 py-0.5" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="probability"
              render={({ field }) => (
                <FormItem className="w-15 space-y-0">
                  <FormLabel className="md:hidden text-xs">Trigger %</FormLabel>
                  <FormControl>
                    <NumberInput
                      min={0}
                      max={100}
                      step={1}
                      {...field}
                      className="h-7 px-2 py-0.5"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FaButton
              icon={faPaste}
              btnSize="size-6"
              iconSize="1x"
              title="Copy entry"
              className="text-foreground border-1 hover:bg-muted-foreground rounded-sm"
              onClick={handleCopy}
            />

            <FaButton
              icon={faTrashCan}
              btnSize="size-6"
              iconSize="1x"
              title="Delete entry"
              className="text-foreground border-1 hover:bg-destructive rounded-sm"
              onClick={handleDelete}
            />
          </div>

          <CollapsibleContent className="overflow-hidden flex flex-col gap-2 pt-2">
            <div className="grid grid-cols-[1fr_92px_1fr] items-center gap-x-2 gap-y-0 mx-[1px]">
              <FormField
                control={form.control}
                name="keys"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Primary Keywords</FormLabel>
                    <FormControl>
                      <Textarea
                        value={primaryKeys}
                        onChange={(e) => {
                          setPrimaryKeys(e.target.value)
                        }}
                        onBlur={(e) => {
                          const values = e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                          field.onChange(values)
                          setPrimaryKeys(values.join(', '))
                        }}
                        placeholder="Comma separated keys"
                        className="min-h-7 h-7 px-2 py-0.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectiveLogic"
                render={({ field }) => (
                  <FormItem className="w-fit space-y-0">
                    <FormLabel className="text-xs">Logic</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-23 h-7 px-1 py-0.5">
                          <SelectValue placeholder="Select logic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-6000">
                        {selectiveLogicOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryKeys"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Optional Filter</FormLabel>
                    <FormControl>
                      <Textarea
                        value={secondaryKeys}
                        onChange={(e) => {
                          setSecondaryKeys(e.target.value)
                        }}
                        onBlur={(e) => {
                          const values = e.target.value
                            .split(',')
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                          const newValue = values.length > 0 ? values : undefined
                          field.onChange(newValue)
                          setSecondaryKeys(values.join(', '))
                        }}
                        placeholder="Comma separated keys (ignored if empty)"
                        className="min-h-7 h-7 px-2 py-0.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-x-2 gap-y-0 mx-[1px]">
              <FormField
                control={form.control}
                name="scanDepth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Scan Depth</FormLabel>
                    <FormControl>
                      <OptionalNumberInput
                        min={0}
                        max={1000}
                        step={1}
                        placeholder="Use global"
                        {...field}
                        className="h-7 px-2 py-0.5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caseSensitive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Case Sensitive</FormLabel>
                    <BooleanSelect field={field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="matchWholeWords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Whole Words</FormLabel>
                    <BooleanSelect field={field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="useGroupScoring"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Group Scoring</FormLabel>
                    <BooleanSelect field={field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="automationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Automation ID</FormLabel>
                    <FormControl>
                      <Input placeholder="None" {...field} className="h-7 px-2 py-0.5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 items-start gap-6">
              <div className="space-y-1">
                <CheckboxField
                  label="Non-recursable (will not be activated by another)"
                  name="excludeRecursion"
                  control={form.control}
                />
                <CheckboxField
                  label="Prevent further recursion (will not activate others)"
                  name="preventRecursion"
                  control={form.control}
                />
                <CheckboxField
                  label="Delay until recursion (can only be activated on recursive checking)"
                  name="delayUntilRecursion"
                  control={form.control}
                />

                <div className="flex flex-wrap justify-end gap-2 gap-y-0">
                  <FormField
                    control={form.control}
                    name="sticky"
                    render={({ field }) => (
                      <FormItem className="w-18 space-y-0">
                        <FormLabel className="text-xs">
                          Sticky <FontAwesomeIcon icon={faComments} size="xs" className="fa-fw" />
                        </FormLabel>
                        <FormControl>
                          <NumberInput min={0} step={1} {...field} className="h-7 px-2 py-0.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cooldown"
                    render={({ field }) => (
                      <FormItem className="w-18 space-y-0">
                        <FormLabel className="text-xs">
                          Cooldown <FontAwesomeIcon icon={faComments} size="xs" className="fa-fw" />
                        </FormLabel>
                        <FormControl>
                          <NumberInput min={0} step={1} {...field} className="h-7 px-2 py-0.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="delay"
                    render={({ field }) => (
                      <FormItem className="w-38 md:w-18 space-y-0">
                        <FormLabel className="text-xs">
                          Delay <FontAwesomeIcon icon={faComments} size="xs" className="fa-fw" />
                        </FormLabel>
                        <FormControl>
                          <NumberInput min={0} step={1} {...field} className="h-7 px-2 py-0.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3 mr-[1px]">
                <FormField
                  control={form.control}
                  name="group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Inclusion Group(s)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Comma separated group names"
                          className="h-7 px-2 py-0.5"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="groupWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Group Weight</FormLabel>
                      <FormControl>
                        <NumberInput min={1} step={1} {...field} className="h-7 px-2 py-0.5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CheckboxField
                  label="Prioritize Inclusion"
                  name="groupOverride"
                  control={form.control}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="mx-[1px]">
                  <FormLabel>
                    Content (Tokens: {contentTokens ?? 0}, UID: {uid})
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="h-32"
                      placeholder="What this keyword should mean to the AI, sent verbatim"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border border-input rounded p-2">
              <div className="flex justify-between items-center gap-4">
                <div className="text-sm">Filter to Characters or Tags</div>
                <CheckboxField
                  label="Exclude"
                  name="characterFilter.isExclude"
                  control={form.control}
                />
              </div>
              <div className="flex flex-wrap justify-between items-center md:gap-4">
                <FormField
                  control={form.control}
                  name="characterFilter.names"
                  render={({ field }) => (
                    <FormItem className="w-full md:flex-1">
                      <FormLabel>Characters</FormLabel>
                      <FormControl>
                        <MultiSelectVirtual
                          options={characterNameOptions}
                          /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
                          values={field.value ?? []}
                          onValuesChange={field.onChange}
                          maxCount={5}
                          placeholder="Select characters"
                          className="border-input"
                          contentClassName="z-8000 w-full border-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="characterFilter.tags"
                  render={({ field }) => (
                    <FormItem className="w-full md:flex-1">
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <MultiSelectVirtual
                          options={tagNameOptions}
                          /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
                          values={field.value ?? []}
                          onValuesChange={field.onChange}
                          maxCount={5}
                          placeholder="Select tags"
                          className="border-input"
                          contentClassName="z-8000 w-full border-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Collapsible className="my-1">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span>Additional Matching Sources</span>
                  <ChevronDownIcon className="transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <CheckboxField
                    label="Character Description"
                    name="matchCharacterDescription"
                    control={form.control}
                  />
                  <CheckboxField
                    label="Persona Description"
                    name="matchPersonaDescription"
                    control={form.control}
                  />
                  <CheckboxField
                    label="Character Personality"
                    name="matchCharacterPersonality"
                    control={form.control}
                  />
                  <CheckboxField
                    label="Character's Note"
                    name="matchCharacterDepthPrompt"
                    control={form.control}
                  />
                  <CheckboxField label="Scenario" name="matchScenario" control={form.control} />
                  <CheckboxField
                    label="Creator's Notes"
                    name="matchCreatorNotes"
                    control={form.control}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CollapsibleContent>
        </Collapsible>
      </form>
    </Form>
  )
})

function BooleanSelect({
  field,
}: {
  field: {
    value: boolean | undefined
    onChange: (value: boolean | undefined) => void
  }
}) {
  return (
    <Select
      value={field.value === undefined ? 'global' : field.value ? 'yes' : 'no'}
      onValueChange={(value: 'global' | 'yes' | 'no') => {
        field.onChange(value === 'global' ? undefined : value === 'yes')
      }}
    >
      <FormControl>
        <SelectTrigger className="h-7 px-2 py-0.5">
          <SelectValue />
        </SelectTrigger>
      </FormControl>
      <SelectContent className="z-6000">
        <SelectItem value="global">Use Global</SelectItem>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </SelectContent>
    </Select>
  )
}
