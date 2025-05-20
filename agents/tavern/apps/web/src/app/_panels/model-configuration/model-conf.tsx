import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormLabel } from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import { Slider } from '@ownxai/ui/components/slider'

import { useCustomizeModelPreset } from '@/hooks/use-model-preset'

const modelConfFormSchema = z.object({
  temperature: z.number().min(0).max(1).step(0.01),
  topP: z.number().min(0).max(1).step(0.01),
  topK: z.number().min(0).max(500).step(1),
  presencePenalty: z.number().min(-1).max(1).step(0.01),
  frequencyPenalty: z.number().min(-1).max(1).step(0.01),
})

export function ModelConf() {
  const {
    activeCustomizedPreset: preset,
    customization,
    saveCustomization,
  } = useCustomizeModelPreset()

  const defaultValues = useMemo(
    () => ({
      temperature: preset.temperature ?? 0,
      topP: preset.topP ?? 1,
      topK: preset.topK ?? 0,
      presencePenalty: preset.presencePenalty ?? 0,
      frequencyPenalty: preset.frequencyPenalty ?? 0,
    }),
    [preset],
  )

  const form = useForm({
    resolver: zodResolver(modelConfFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = (values: z.infer<typeof modelConfFormSchema>) => {
    void saveCustomization({
      ...customization,
      ...values,
    })
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onBlur={() => {
            onSubmit(modelConfFormSchema.parse(form.getValues()))
          }}
          className="space-y-2"
        >
          <SliderInputField
            label="Temperature"
            name="temperature"
            control={form.control}
            defaultValue={defaultValues.temperature}
            min={0}
            max={1}
            step={0.01}
          />

          <SliderInputField
            label="Top P"
            name="topP"
            control={form.control}
            defaultValue={defaultValues.topP}
            min={0}
            max={1}
            step={0.01}
          />

          <SliderInputField
            label="Top K"
            name="topK"
            control={form.control}
            defaultValue={defaultValues.topK}
            min={0}
            max={500}
            step={1}
          />

          <SliderInputField
            label="Presence Penalty"
            name="presencePenalty"
            control={form.control}
            defaultValue={defaultValues.presencePenalty}
            min={-1}
            max={1}
            step={0.01}
          />

          <SliderInputField
            label="Frequency Penalty"
            name="frequencyPenalty"
            control={form.control}
            defaultValue={defaultValues.frequencyPenalty}
            min={-1}
            max={1}
            step={0.01}
          />
        </form>
      </Form>
    </div>
  )
}

function SliderInputField({
  label,
  name,
  control,
  defaultValue,
  min,
  max,
  step,
}: {
  label: string
  name: string
  control: any
  defaultValue: number
  min: number
  max: number
  step: number
}) {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    setInputValue(defaultValue.toString())
  }, [defaultValue])

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex gap-4 items-center">
                <Slider
                  min={min}
                  max={max}
                  step={step}
                  value={[field.value]}
                  onValueChange={([value]) => {
                    field.onChange(value)
                    setInputValue(value!.toString())
                  }}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                  }}
                  onBlur={() => {
                    const numValue = parseFloat(inputValue)
                    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
                      // Round to the nearest step
                      const roundedValue = Math.round(numValue / step) * step
                      setInputValue(roundedValue.toString())
                      field.onChange(roundedValue)
                    } else {
                      // Reset to previous valid value if invalid
                      setInputValue(field.value.toString())
                    }
                  }}
                  className="w-18 h-6.5 px-1.5 py-0.5 rounded-sm text-center"
                />
              </div>
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}
