import type { ComponentPropsWithoutRef } from 'react'
import { useEffect, useState } from 'react'

import { Input } from '@ownxai/ui/components/input'

export function OptionalNumberInput({
  value,
  onChange,
  min,
  max,
  step,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> & {
  value?: number
  onChange: (value?: number) => void
  min?: number
  max?: number
  step: number
}) {
  const [inputValue, setInputValue] = useState(value?.toString() ?? '')

  useEffect(() => {
    setInputValue(value?.toString() ?? '')
  }, [value])

  const handleBlur = () => {
    if (inputValue.trim() === '') {
      onChange(undefined)
      return
    }

    const numValue = parseFloat(inputValue)
    if (
      !isNaN(numValue) &&
      (typeof min !== 'number' || numValue >= min) &&
      (typeof max !== 'number' || numValue <= max)
    ) {
      // Round to the nearest step
      const roundedValue = Math.round(numValue / step) * step
      setInputValue(roundedValue.toString())
      onChange(roundedValue)
    } else {
      // Reset to previous valid value if invalid
      setInputValue(value?.toString() ?? '')
    }
  }

  return (
    <Input
      type="number"
      {...props}
      min={min}
      max={max}
      step={step}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      className={className}
    />
  )
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> & {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step: number
}) {
  const [inputValue, setInputValue] = useState(value.toString())

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleBlur = () => {
    const numValue = parseFloat(inputValue)
    if (
      !isNaN(numValue) &&
      (typeof min !== 'number' || numValue >= min) &&
      (typeof max !== 'number' || numValue <= max)
    ) {
      // Round to the nearest step
      const roundedValue = Math.round(numValue / step) * step
      setInputValue(roundedValue.toString())
      onChange(roundedValue)
    } else {
      // Reset to previous valid value if invalid
      setInputValue(value.toString())
    }
  }

  return (
    <Input
      type="number"
      {...props}
      min={min}
      max={max}
      step={step}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      className={className}
    />
  )
}
