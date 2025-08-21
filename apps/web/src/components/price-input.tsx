import type { ComponentPropsWithoutRef } from 'react'

import { NumberInput, OptionalNumberInput } from './number-input'

export function OptionalPriceInput({
  value,
  onChange,
  max,
  className,
  ...props
}: Omit<
  ComponentPropsWithoutRef<typeof OptionalNumberInput>,
  'value' | 'onChange' | 'min' | 'step'
> & {
  value?: string
  onChange: (value?: string) => void
  max?: number
}) {
  return (
    <OptionalNumberInput
      value={value?.length ? parseFloat(value) : undefined}
      onChange={(value) => {
        onChange(typeof value === 'number' ? value.toString() : undefined)
      }}
      min={0}
      max={max}
      step={0.01}
      className={className}
      {...props}
    />
  )
}

export function PriceInput({
  value,
  onChange,
  max,
  className,
  ...props
}: Omit<
  ComponentPropsWithoutRef<typeof OptionalNumberInput>,
  'value' | 'onChange' | 'min' | 'step'
> & {
  value: string
  onChange: (value: string) => void
  max?: number
}) {
  return (
    <NumberInput
      value={parseFloat(value)}
      onChange={(value) => {
        onChange(value.toString())
      }}
      min={0}
      max={max}
      step={0.01}
      className={className}
      {...props}
    />
  )
}
