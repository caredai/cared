'use client'

import { Search, X } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { Input } from '@cared/ui/components/input'
import { cn } from '@cared/ui/lib/utils'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  inputClassName?: string
}

/**
 * Search input component with integrated search icon and clear button
 * Left side contains search icon, right side contains clear button (X) when there's text
 */
export function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  className,
  inputClassName,
}: SearchInputProps) {
  const handleClear = () => {
    onChange('')
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      {/* Search icon on the left */}
      <Search className="absolute left-2 h-4 w-4 text-muted-foreground pointer-events-none" />

      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'px-8', // Left padding for search icon, right padding for clear button
          inputClassName,
        )}
      />

      {/* Clear button (X) on the right when there's text */}
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 h-6 w-6 p-0 hover:bg-muted text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
