import type { SummarySettings } from '@tavern/core'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { SummaryBuildingMode, SummaryPosition, summarySettingsSchema } from '@tavern/core'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@ownxai/ui/components/form'
import { Label } from '@ownxai/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@ownxai/ui/components/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Textarea } from '@ownxai/ui/components/textarea'

import { CheckboxField } from '@/components/checkbox-field'
import { NumberInput } from '@/components/number-input'
import { SliderInputField } from '@/components/slider-input-field'
import { useSummarySettings, useUpdateSummarySettings } from '@/hooks/use-settings'
import { useCurrentSummary, useUpdateSummary } from '@/hooks/use-summary'

const injectionPositionOptions = [
  { value: 'none', label: 'None (not injected)', position: SummaryPosition.NONE },
  {
    value: 'before-prompt',
    label: 'Before Main Prompt / Story String',
    position: SummaryPosition.BEFORE_PROMPT,
  },
  {
    value: 'in-prompt',
    label: 'After Main Prompt / Story String',
    position: SummaryPosition.IN_PROMPT,
  },
  {
    value: 'at-depth-system',
    label: 'At Depth (⚙️ System)',
    position: SummaryPosition.IN_CHAT,
    role: 'system' as const,
  },
  {
    value: 'at-depth-user',
    label: 'At Depth (👤 User)',
    position: SummaryPosition.IN_CHAT,
    role: 'user' as const,
  },
  {
    value: 'at-depth-assistant',
    label: 'At Depth (🤖 Assistant)',
    position: SummaryPosition.IN_CHAT,
    role: 'assistant' as const,
  },
]

export function SummaryExtension() {
  const summarySettings = useSummarySettings()
  const updateSummarySettings = useUpdateSummarySettings()
  const currentSummary = useCurrentSummary()
  const updateSummary = useUpdateSummary()

  const [showSettings, setShowSettings] = useState(false)
  const [currentSummaryText, setCurrentSummaryText] = useState(currentSummary?.summary ?? '')

  useEffect(() => {
    setCurrentSummaryText(currentSummary?.summary ?? '')
  }, [currentSummary?.summary])

  const form = useForm<SummarySettings>({
    resolver: zodResolver(summarySettingsSchema),
    defaultValues: summarySettings,
  })

  useEffect(() => {
    form.reset(summarySettings)
  }, [summarySettings, form])

  const isInjectionPositionAtDepth = form.watch('injectionPosition') === SummaryPosition.IN_CHAT

  const handleSummarizeNow = () => {
    // TODO: Implement summarize now functionality
    console.log('Summarize now clicked')
  }

  const handleFormBlur = () => {
    const values = form.getValues()
    void updateSummarySettings(values)
  }

  const handleCurrentSummaryBlur = () => {
    if (currentSummary?.id) {
      void updateSummary(currentSummary.id, currentSummaryText)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current summary textarea */}
      <div className="space-y-2">
        <Label>Current Summary</Label>
        <Textarea
          value={currentSummaryText}
          onChange={(e) => setCurrentSummaryText(e.target.value)}
          onBlur={handleCurrentSummaryBlur}
          placeholder="No summary available"
          className="h-24"
        />
      </div>

      <Form {...form}>
        <form onBlur={handleFormBlur} className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-1.5 has-[>svg]:px-1.5 text-xs"
              onClick={handleSummarizeNow}
            >
              Summarize Now
            </Button>
            <div className="flex items-center gap-4">
              <CheckboxField label="Auto" name="auto" control={form.control} />
              <CheckboxField label="No WI/AN" name="skipWIAN" control={form.control} />
            </div>
          </div>

          {/* Summary Settings */}
          <Collapsible open={showSettings} onOpenChange={setShowSettings}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-1.5 has-[>svg]:px-1.5 text-xs w-fit justify-between"
              >
                Summary Settings
                <ChevronDownIcon className="transition-transform duration-200" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Building Mode */}
              <FormField
                control={form.control}
                name="buildingMode"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel>Building Mode</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value.toString()}
                        onValueChange={(value: string) => field.onChange(parseInt(value))}
                        className="flex flex-col gap-1.5"
                      >
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              className="border-ring"
                              value={SummaryBuildingMode.DEFAULT.toString()}
                            />
                          </FormControl>
                          <div className="flex flex-col gap-1 leading-none">
                            <FormLabel className="font-normal">Classic, blocking</FormLabel>
                            <FormDescription>
                              Use the regular main prompt builder and add the summary request to it
                              as the last system message.
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              className="border-ring"
                              value={SummaryBuildingMode.RAW_BLOCKING.toString()}
                            />
                          </FormControl>
                          <div className="flex flex-col gap-1 leading-none">
                            <FormLabel className="font-normal">Raw, blocking</FormLabel>
                            <FormDescription>
                              Build its own prompt using messages that were not summarized yet.
                              Blocks the chat until the summary is generated.
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              className="border-ring"
                              value={SummaryBuildingMode.RAW_NON_BLOCKING.toString()}
                            />
                          </FormControl>
                          <div className="flex flex-col gap-1 leading-none">
                            <FormLabel className="font-normal">Raw, non-blocking</FormLabel>
                            <FormDescription>
                              Build its own prompt using messages that were not summarized yet. Does
                              not block the chat while the summary is being generated.
                            </FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Summary Prompt */}
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary Prompt</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter summary prompt" className="h-24" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Target summary words slider */}
              <SliderInputField
                label="Target summary words"
                name="targetWords"
                control={form.control}
                min={25}
                max={1000}
                step={25}
              />

              {/* Max response tokens slider */}
              <SliderInputField
                label={
                  <span>
                    Max response tokens{' '}
                    <span className="text-muted-foreground text-xs">(0 = default)</span>
                  </span>
                }
                name="overrideResponseMaxTokens"
                control={form.control}
                min={0}
                max={4096}
                step={16}
              />

              {/* Max messages per request slider */}
              <SliderInputField
                label={
                  <span>
                    Max messages per request{' '}
                    <span className="text-muted-foreground text-xs">(0 = unlimited)</span>
                  </span>
                }
                name="maxMessagesPerRequest"
                control={form.control}
                min={0}
                max={250}
                step={1}
              />

              {/* Summarizing Frequency Section */}
              <div className="space-y-2 my-8">
                <h1 className="text-center text-sm font-bold">Summarizing Frequency</h1>

                {/* Summarize every X messages slider */}
                <SliderInputField
                  label={
                    <span>
                      Summarize every X messages{' '}
                      <span className="text-muted-foreground text-xs">(0 = disable)</span>
                    </span>
                  }
                  name="messagesInterval"
                  control={form.control}
                  min={0}
                  max={250}
                  step={1}
                />

                {/* Summarize every X words slider */}
                <SliderInputField
                  label={
                    <span>
                      Summarize every X words{' '}
                      <span className="text-muted-foreground text-xs">(0 = disable)</span>
                    </span>
                  }
                  name="wordsInterval"
                  control={form.control}
                  min={0}
                  max={10000}
                  step={100}
                />

                {/* Explanation for both sliders */}
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  If both sliders are non-zero, then both will trigger summary updates at their
                  respective intervals.
                </div>
              </div>

              {/* Injection Template */}
              <FormField
                control={form.control}
                name="injectionTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Injection Template</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter injection template"
                        className="h-16"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Include in World Info Scanning checkbox */}
              <CheckboxField
                label="Include in World Info Scanning"
                name="inWIScan"
                control={form.control}
              />

              {/* Injection Position */}
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="injectionPosition"
                  render={() => (
                    <FormItem>
                      <FormLabel>Injection Position</FormLabel>
                      <Select
                        value={(() => {
                          const pos = form.watch('injectionPosition')
                          const role = form.watch('role')
                          const found = injectionPositionOptions.find(
                            (opt) =>
                              opt.position === pos &&
                              (opt.position === SummaryPosition.IN_CHAT ? opt.role === role : true),
                          )
                          return found?.value ?? ''
                        })()}
                        onValueChange={(value) => {
                          const selectedOption = injectionPositionOptions.find(
                            (opt) => opt.value === value,
                          )
                          if (!selectedOption) return
                          form.setValue('injectionPosition', selectedOption.position)
                          if (
                            selectedOption.position === SummaryPosition.IN_CHAT &&
                            selectedOption.role
                          ) {
                            form.setValue('role', selectedOption.role)
                          } else {
                            form.setValue('role', undefined)
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-7 px-1 py-0.5">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-6000">
                          {injectionPositionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Depth (only show when position is IN_CHAT) */}
                {isInjectionPositionAtDepth && (
                  <FormField
                    control={form.control}
                    name="depth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Depth</FormLabel>
                        <FormControl>
                          <NumberInput
                            min={0}
                            step={1}
                            value={field.value ?? 2}
                            onChange={(value) => field.onChange(value)}
                            className="w-20 h-7 px-2 py-0.5 rounded-sm text-xs md:text-xs font-mono"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Form>
    </div>
  )
}
