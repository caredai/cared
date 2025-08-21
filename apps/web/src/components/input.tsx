import type { ComponentPropsWithoutRef } from 'react'
import { useEffect, useState } from 'react'
import { LucideEye, LucideEyeOff } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { Input as Input_ } from '@cared/ui/components/input'
import { Textarea } from '@cared/ui/components/textarea'
import { cn } from '@cared/ui/lib/utils'

export function Input({
  value,
  onChange,
  onBlur,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Input_>, 'value' | 'onChange' | 'onBlur'> & {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
}) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleBlur = () => {
    onChange(inputValue.trim())
    setInputValue(inputValue.trim())
    onBlur()
  }

  const [showPassword, setPassword] = useState(false)

  const inputNode = (
    <Input_
      {...props}
      type={props.type !== 'password' || showPassword ? 'text' : 'password'}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      className={cn(className, props.type === 'password' && 'pr-9')}
    />
  )

  if (props.type !== 'password') {
    return inputNode
  } else {
    return (
      <div className="relative">
        {inputNode}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setPassword(!showPassword)}
          disabled={props.disabled}
        >
          {showPassword ? <LucideEyeOff className="h-4 w-4" /> : <LucideEye className="h-4 w-4" />}
        </Button>
      </div>
    )
  }
}

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
      onChange={setInputValue}
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
