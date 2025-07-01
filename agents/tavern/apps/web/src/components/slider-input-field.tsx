import type { ReactNode } from 'react'

import { FormControl, FormField, FormItem, FormLabel } from '@ownxai/ui/components/form'
import { Slider } from '@ownxai/ui/components/slider'

import { NumberInput } from './number-input'

export function SliderInputField({
  label,
  name,
  control,
  min,
  max,
  step,
}: {
  label: ReactNode
  name: string
  control: any
  min: number
  max: number
  step: number
}) {
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
                  }}
                  className="flex-1"
                />
                <NumberInput
                  value={field.value}
                  onChange={field.onChange}
                  min={min}
                  max={max}
                  step={step}
                  className="w-20 h-6.5 px-1.5 py-0.5 rounded-sm text-xs md:text-xs font-mono text-center"
                />
              </div>
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}
