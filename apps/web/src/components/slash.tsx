import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@cared/ui/lib/utils'

export function Slash({ className, ...props }: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn('text-muted-foreground', className)}
      {...props}
    >
      <path d="M16 3.549L7.12 20.600"></path>
    </svg>
  )
}
