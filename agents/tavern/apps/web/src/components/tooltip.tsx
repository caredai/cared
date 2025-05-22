import type { LucideIcon } from 'lucide-react'
import * as React from 'react'
import { InfoIcon } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@ownxai/ui/components/popover'
import { cn } from '@ownxai/ui/lib/utils'

interface TooltipProps {
  // Content to be displayed in the tooltip
  content: React.ReactNode
  // Optional Lucide icon component to use as trigger (defaults to InfoIcon)
  icon?: LucideIcon
  // Optional className for the trigger button
  className?: string
  // Optional className for the tooltip content
  contentClassName?: string
  // Optional side where the tooltip should appear
  side?: 'top' | 'right' | 'bottom' | 'left'
  // Optional alignment of the tooltip
  align?: 'start' | 'center' | 'end'
}

export function Tooltip({
  content,
  icon: Icon = InfoIcon,
  className,
  contentClassName,
  side = 'top',
  align = 'center',
}: TooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'h-4 w-4 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors',
            className,
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn(
          'z-10000 w-64 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          contentClassName,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
