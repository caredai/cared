import type { RegexScript } from '@tavern/core'
import type { ComponentPropsWithoutRef } from 'react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  faArrowDown,
  faArrowUp,
  faBars,
  faBug,
  faFileExport,
  faToggleOff,
  faToggleOn,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  regexFromString,
  RegexPlacement,
  regexScriptSchema,
  RegexSubstituteMode,
} from '@tavern/core'
import { CheckCircle2Icon, ChevronDownIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import hash from 'stable-hash'

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
import { Label } from '@ownxai/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Textarea } from '@ownxai/ui/components/textarea'

import { CheckboxField, CheckboxGroupField } from '@/components/checkbox-field'
import { FaButton } from '@/components/fa-button'
import { OptionalNumberInput } from '@/components/number-input'
import { cn } from '@/lib/utils'

const placementOptions = [
  { value: RegexPlacement.USER_INPUT, label: 'User Input' },
  { value: RegexPlacement.AI_OUTPUT, label: 'AI Output' },
  { value: RegexPlacement.SLASH_COMMAND, label: 'Slash Commands' },
  { value: RegexPlacement.WORLD_INFO, label: 'World Info' },
  { value: RegexPlacement.REASONING, label: 'Reasoning' },
]

const substituteModeOptions = [
  { value: RegexSubstituteMode.NONE, label: "Don't substitute" },
  { value: RegexSubstituteMode.RAW, label: 'Substitute (raw)' },
  { value: RegexSubstituteMode.ESCAPED, label: 'Substitute (escaped)' },
]

export const RegexScriptItem = memo(
  function RegexScriptItem({
    index,
    script,
    open,
    onOpenChange,
    onUpdate,
    onDelete,
    onMove,
    moveType,
    debugRegex,
  }: {
    index: number
    script: RegexScript
    open?: boolean
    onOpenChange?: (index: number, open: boolean) => void
    onUpdate?: (index: number, script: RegexScript) => void
    onDelete?: (index: number) => void
    onMove?: (index: number) => void
    moveType: 'moveToGlobal' | 'moveToCharacter'
    debugRegex?: (script: RegexScript, rawString: string) => string
  } & ComponentPropsWithoutRef<'div'>) {
    const [trimStrings, setTrimStrings] = useState<string>(script.trimStrings.join(', '))

    const form = useForm<RegexScript>({
      resolver: zodResolver(regexScriptSchema),
      defaultValues: script,
    })

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: script.id,
    })

    useEffect(() => {
      form.reset(script)
    }, [script, form])

    const handleBlur = useCallback(async () => {
      if (!(await form.trigger())) {
        return
      }
      const values = form.getValues()
      onUpdate?.(index, values)
    }, [form, onUpdate, index])

    const handleExport = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        const values = form.getValues()
        const dataStr = JSON.stringify(values, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${values.name || 'regex-script'}.json`
        link.click()
        URL.revokeObjectURL(url)
      },
      [form],
    )

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        onDelete?.(index)
      },
      [onDelete, index],
    )

    const handleMove = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        onMove?.(index)
      },
      [onMove, index],
    )

    const regexInfo = useMemo(() => {
      const regex = regexFromString(form.watch('regex'))
      if (!regex) {
        return
      }

      const flagInfo = []
      flagInfo.push(
        regex.flags.includes('g') ? `Applies to all matches.` : `Applies to the first match.`,
      )
      flagInfo.push(regex.flags.includes('i') ? `Case insensitive.` : `Case sensitive.`)
      return flagInfo.join(' ')
    }, [form.watch('regex')])

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <Form {...form}>
        <form
          ref={setNodeRef}
          style={style}
          className={cn(
            'flex flex-col justify-center p-1 my-0.25 border border-border rounded-md',
            isDragging && 'invisible',
          )}
          onBlur={handleBlur}
          autoComplete="off"
        >
          <Collapsible open={open} onOpenChange={(open) => onOpenChange?.(index, open)}>
            <div className="flex justify-between items-center gap-2">
              <div className="flex justify-between items-center gap-2">
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

                <FaButton
                  icon={faBars}
                  btnSize="size-4"
                  iconSize="sm"
                  className="text-foreground hover:bg-muted-foreground cursor-grab"
                  {...attributes}
                  {...listeners}
                />

                <Label className={cn('line-clamp-1', form.watch('disabled') && 'line-through')}>
                  {form.watch('name')}
                </Label>
              </div>

              <div className="flex justify-between items-center gap-2">
                <FormField
                  control={form.control}
                  name="disabled"
                  render={({ field }) => (
                    <FormItem className="space-y-0 h-6">
                      <FormControl>
                        <FaButton
                          icon={field.value ? faToggleOff : faToggleOn}
                          btnSize="size-6"
                          iconSize="1x"
                          className={cn(
                            'text-foreground border-1 hover:bg-muted-foreground rounded-sm',
                            field.value && 'text-muted-foreground',
                          )}
                          onClick={(e) => {
                            e.preventDefault()
                            field.onChange(!field.value)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FaButton
                  icon={moveType === 'moveToCharacter' ? faArrowDown : faArrowUp}
                  btnSize="size-6"
                  iconSize="1x"
                  title={
                    moveType === 'moveToCharacter'
                      ? 'Move to Character Scripts'
                      : 'Move to Global Scripts'
                  }
                  className="text-foreground border-1 hover:bg-muted-foreground rounded-sm"
                  onClick={handleMove}
                />

                <FaButton
                  icon={faFileExport}
                  btnSize="size-6"
                  iconSize="1x"
                  title="Export script"
                  className="text-foreground border-1 hover:bg-muted-foreground rounded-sm"
                  onClick={handleExport}
                />

                <FaButton
                  icon={faTrashCan}
                  btnSize="size-6"
                  iconSize="1x"
                  title="Delete script"
                  className="text-foreground border-1 hover:bg-destructive rounded-sm"
                  onClick={handleDelete}
                />
              </div>
            </div>

            <CollapsibleContent className="overflow-hidden">
              <div className="flex flex-col gap-2 pt-2">
                <RegexDebugPanel script={form.watch()} debugRegex={debugRegex} />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mx-[1px]">
                      <FormLabel className="text-xs">Script Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-7 px-2 py-0.5" placeholder="Script name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regex"
                  render={({ field }) => (
                    <FormItem className="mx-[1px]">
                      <FormLabel className="text-xs">Find Regex</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="h-16"
                          placeholder="Regular expression pattern"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {regexInfo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="size-4" />
                    {regexInfo}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="replaceString"
                  render={({ field }) => (
                    <FormItem className="mx-[1px]">
                      <FormLabel className="text-xs">Replace With</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="h-16"
                          placeholder="Use {{match}} to include the matched text from the Find Regex or $1, $2, etc. for capture groups."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trimStrings"
                  render={({ field }) => (
                    <FormItem className="mx-[1px]">
                      <FormLabel className="text-xs">Trim Out</FormLabel>
                      <FormControl>
                        <Textarea
                          value={trimStrings}
                          onChange={(e) => {
                            setTrimStrings(e.target.value)
                          }}
                          onBlur={(e) => {
                            const values = e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                            field.onChange(values)
                            setTrimStrings(values.join(', '))
                          }}
                          placeholder="Comma separated strings to trim. Trims any unwanted parts from a regex match before replacement."
                          className="h-16"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-start gap-4">
                  <div className="space-y-2">
                    <CheckboxGroupField
                      label="Affects"
                      name="placement"
                      control={form.control}
                      options={placementOptions}
                    />

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between gap-2 m-[1px]">
                        <FormField
                          control={form.control}
                          name="minDepth"
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormLabel className="text-xs">Min Depth</FormLabel>
                              <FormControl>
                                <OptionalNumberInput
                                  min={0}
                                  step={1}
                                  placeholder="Unlimited"
                                  {...field}
                                  className="h-6.5 px-1.5 py-0.5 rounded-sm text-xs md:text-xs font-mono text-center"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxDepth"
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormLabel className="text-xs">Max Depth</FormLabel>
                              <FormControl>
                                <OptionalNumberInput
                                  min={0}
                                  step={1}
                                  placeholder="Unlimited"
                                  {...field}
                                  className="h-6.5 px-1.5 py-0.5 rounded-sm text-xs md:text-xs font-mono text-center"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Show the error message for minDepth/maxDepth */}
                      <FormField
                        control={form.control}
                        name="minDepth"
                        render={() => (
                          <FormItem className="w-48">
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Other Options</Label>
                      <CheckboxField label="Disabled" name="disabled" control={form.control} />
                      <CheckboxField label="Run On Edit" name="runOnEdit" control={form.control} />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Macros in Find Regex</Label>
                      <FormField
                        control={form.control}
                        name="substituteMode"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={(value) => field.onChange(Number(value))}
                              value={String(field.value)}
                            >
                              <FormControl>
                                <SelectTrigger className="h-7 px-2 py-0.5">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-6000">
                                {substituteModeOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={String(opt.value)}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Ephemerality</Label>
                      <CheckboxField
                        label="Alter Chat Display"
                        name="displayOnly"
                        control={form.control}
                      />
                      <CheckboxField
                        label="Alter Outgoing Prompt"
                        name="promptOnly"
                        control={form.control}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Form>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      hash(prevProps.script) === hash(nextProps.script) &&
      prevProps.open === nextProps.open &&
      prevProps.moveType === nextProps.moveType
    )
  },
)

function RegexDebugPanel({
  script,
  debugRegex,
}: {
  script: RegexScript
  debugRegex?: (script: RegexScript, rawString: string) => string
}) {
  const [debugOpen, setDebugOpen] = useState(false)
  const [debugInput, setDebugInput] = useState('')
  const [debugOutput, setDebugOutput] = useState('')

  const handleDebug = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDebugOpen(!debugOpen)
    },
    [debugOpen],
  )

  // Only calculate output when debug is open and input changes
  useEffect(() => {
    if (debugOpen) {
      const output = debugRegex?.(script, debugInput)
      setDebugOutput(output ?? debugInput)
    } else {
      setDebugOutput('')
    }
  }, [debugInput, debugRegex, script, debugOpen])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'w-fit h-7 px-1.5 has-[>svg]:px-1.5 text-xs',
          debugOpen &&
            'bg-muted-foreground text-background hover:bg-muted-foreground/80 hover:text-background',
        )}
        onClick={handleDebug}
      >
        <FontAwesomeIcon icon={faBug} size="1x" className="fa-fw" />
        Debug
      </Button>

      {debugOpen && (
        <div className="flex gap-2 mx-[1px]">
          <div className="flex-1">
            <Label className="text-xs">Input</Label>
            <Textarea
              value={debugInput}
              onChange={(e) => setDebugInput(e.target.value)}
              placeholder="Enter text to test the regex script..."
              className="h-24"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Output</Label>
            <Textarea
              value={debugOutput}
              readOnly
              placeholder="Output will appear here..."
              className="h-24 bg-muted"
            />
          </div>
        </div>
      )}
    </>
  )
}
