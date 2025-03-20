import type { VirtualizerHandle } from 'virtua'
import * as React from 'react'
import { Primitive } from '@radix-ui/react-primitive'
import * as SelectPrimitive from '@radix-ui/react-select'

import {
  SelectItem,
  SelectScrollDownButton,
  SelectScrollUpButton,
} from '@mindworld/ui/components/select'
import { VirtualizedVirtualizer } from '@mindworld/ui/components/virtualized'
import { cn } from '@mindworld/ui/lib/utils'

export interface Item {
  label: string
  value?: string // `undefined` for group labels
}

export function VirtualizedSelectContent({
  items,
  open,
  value,
  className,
  ...props
}: {
  items: Item[]
  open: boolean
  value: string
} & Omit<React.ComponentProps<typeof SelectPrimitive.Content>, 'position' | 'children'>) {
  const virtualizerRef = React.useRef<VirtualizerHandle>(null)
  const viewportRef = React.useRef<HTMLDivElement>(null)

  const activeIndex = React.useMemo(
    () => items.findIndex((item) => item.value === value),
    [items, value],
  )

  React.useLayoutEffect(() => {
    if (!open || !value || activeIndex === -1) return

    setTimeout(() => {
      // Recover scroll position.
      virtualizerRef.current?.scrollToIndex(activeIndex, { align: 'center' })

      const checkedElement = viewportRef.current?.querySelector(
        '[data-state=checked]',
      ) as HTMLElement | null

      // Recover focus.
      checkedElement?.focus({ preventScroll: true })
    })
  }, [open, value, activeIndex])

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]',
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position="popper"
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          ref={viewportRef}
          className={cn(
            'p-1',
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          <VirtualizedVirtualizer
            ref={virtualizerRef}
            keepMounted={activeIndex !== -1 ? [activeIndex] : undefined}
            overscan={2}
          >
            {items.map((item) =>
              !item.value ? (
                <SelectLabel key={item.label}>{item.label}</SelectLabel>
              ) : (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ),
            )}
          </VirtualizedVirtualizer>
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <Primitive.div
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName
