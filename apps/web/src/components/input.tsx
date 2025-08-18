import type { ComponentPropsWithoutRef } from 'react'
import { useEffect, useState } from 'react'

import { Input } from '@cared/ui/components/input'
import { Textarea } from '@cared/ui/components/textarea'

export function OptionalInput({
  value,
  onChange,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> & {
  value?: string
  onChange: (value?: string) => void
}) {
  const [inputValue, setInputValue] = useState(value?.toString() ?? '')

  useEffect(() => {
    setInputValue(value?.toString() ?? '')
  }, [value])

  const handleBlur = () => {
    if (inputValue.trim() === '') {
      onChange(undefined)
    } else {
      onChange(inputValue.trim())
    }
    setInputValue(inputValue.trim())
  }

  return (
    <Input
      {...props}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      className={className}
    />
  )
}

export function OptionalTextarea({
  value,
  onChange,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Textarea>, 'value' | 'onChange'> & {
  value?: string
  onChange: (value?: string) => void
}) {
  const [inputValue, setInputValue] = useState(value?.toString() ?? '')

  useEffect(() => {
    setInputValue(value?.toString() ?? '')
  }, [value])

  const handleBlur = () => {
    if (inputValue.trim() === '') {
      onChange(undefined)
    } else {
      onChange(inputValue.trim())
    }
    setInputValue(inputValue.trim())
  }

  return (
    <Textarea
      {...props}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      className={className}
    />
  )
}
