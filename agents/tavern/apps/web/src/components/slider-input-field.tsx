import { useEffect, useState } from 'react'

import { FormControl, FormField, FormItem, FormLabel } from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import { Slider } from '@ownxai/ui/components/slider'

export function SliderInputField({
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
