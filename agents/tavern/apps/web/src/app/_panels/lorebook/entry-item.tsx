import type { z } from 'zod'
import { useCallback } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { lorebookEntrySchema, SelectiveLogic } from '@tavern/core'
import { ChevronDownIcon, HelpCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@ownxai/ui/components/button'
import { Checkbox } from '@ownxai/ui/components/checkbox'
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
import { Textarea } from '@ownxai/ui/components/textarea'

import { Tooltip } from '@/components/tooltip'
import { useUpdateLorebook } from '@/hooks/use-lorebook'

const selectiveLogicOptions = [
  { value: 'andAny', label: 'AND ANY' },
  { value: 'notAll', label: 'NOT ALL' },
  { value: 'notAny', label: 'NOT ANY' },
  { value: 'andAll', label: 'AND ALL' },
]
const positionOptions = [
  { value: 0, label: 'Before Char Defs' },
  { value: 1, label: 'After Char Defs' },
  { value: 2, label: 'Top of AN' },
  { value: 3, label: 'Bottom of AN' },
  { value: 4, label: '@ Depth' },
  { value: 5, label: 'Before Example Messages' },
  { value: 6, label: 'After Example Messages' },
]
const roleOptions = [
  { value: 'system', label: 'System' },
  { value: 'user', label: 'User' },
  { value: 'assistant', label: 'Assistant' },
]

const entryFormSchema = lorebookEntrySchema.required()

export type EntryFormValues = z.infer<typeof entryFormSchema>

export function EntryItemEdit({
  id,
  uid,
  defaultValues,
}: {
  id: string
  uid: number
  defaultValues: Partial<EntryFormValues>
}) {
  const updateLorebook = useUpdateLorebook()
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      keys: [],
      secondaryKeys: [],
      comment: '',
      content: '',
      constant: false,
      vectorized: false,
      selectiveLogic: SelectiveLogic.AND_ANY,
      order: 0,
      position: 0,
      excludeRecursion: false,
      preventRecursion: false,
      delayUntilRecursion: false,
      probability: 1,
      depth: 0,
      group: '',
      groupOverride: false,
      groupWeight: 100,
      sticky: 0,
      cooldown: 0,
      delay: 0,
      scanDepth: 0,
      caseSensitive: false,
      matchWholeWords: false,
      useGroupScoring: false,
      automationId: '',
      role: 'system',
      selective: false,
      useProbability: false,
      addMemo: false,
      disabled: false,
      characterFilter: { isExclude: false, names: [], tags: [] },
      ...defaultValues,
    },
  })

  const handleBlur = useCallback(() => {
    const values = form.getValues()
    void updateLorebook(id, [
      { type: 'updateEntry', uid, entry: { ...values, uid } },
    ])
  }, [form, updateLorebook, id, uid])

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center cursor-pointer [&[data-state=open]>button>svg]:rotate-180">
          <div className="flex items-center gap-1">
            Entry Settings
            <Tooltip content="Configure entry settings and parameters" icon={HelpCircle} />
          </div>
          <Button type="button" variant="outline" size="icon" className="size-6">
            <ChevronDownIcon className="transition-transform duration-200" />
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden flex flex-col gap-2 pt-2">
        <Form {...form}>
          <form className="flex flex-col gap-4" onBlur={handleBlur} autoComplete="off">
            <FormField
              control={form.control}
              name="keys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keys (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value.join(', ')}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="e.g. magic, dragon, sword"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondaryKeys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Keys (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value.join(', ')}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="e.g. legend, quest"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional comment" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="h-32" placeholder="Entry content" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="constant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Constant</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vectorized"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Vectorized</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="selectiveLogic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selective Logic</FormLabel>
                    <FormControl>
                      <select {...field} className="input">
                        {selectiveLogicOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <select {...field} className="input">
                        {positionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} max={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depth</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Group name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="groupOverride"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Group Override</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="groupWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Weight</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sticky"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sticky</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cooldown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cooldown</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="scanDepth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scan Depth</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caseSensitive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Case Sensitive</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="matchWholeWords"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Match Whole Words</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="useGroupScoring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Use Group Scoring</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="automationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Automation ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <select {...field} className="input">
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="excludeRecursion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Exclude Recursion</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preventRecursion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Prevent Recursion</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="delayUntilRecursion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Delay Until Recursion</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selective"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Selective</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="useProbability"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Use Probability</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addMemo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Add Memo</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="border rounded p-2 mt-2">
              <div className="font-semibold mb-2">Character/Tag Filter</div>
              <FormField
                control={form.control}
                name="characterFilter.isExclude"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Exclude Mode</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="characterFilter.names"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Names (comma separated)</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value.join(', ')}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
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
                  <FormItem>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value.join(', ')}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 mt-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>Disabled</FormLabel>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
