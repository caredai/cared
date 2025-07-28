import type { ComponentProps } from 'react'
import { LoaderCircle, LoaderIcon, LoaderPinwheel } from 'lucide-react'

import { cn } from '@cared/ui/lib/utils'

export function Spinner({ className, ...props }: ComponentProps<typeof LoaderIcon>) {
  return <LoaderIcon className={cn('animate-spin', className)} {...props} />
}

export function CircleSpinner({ className, ...props }: ComponentProps<typeof LoaderCircle>) {
  return <LoaderCircle className={cn('animate-spin', className)} {...props} />
}

export function PinwheelSpinner({ className, ...props }: ComponentProps<typeof LoaderPinwheel>) {
  return <LoaderPinwheel className={cn('animate-spin', className)} {...props} />
}
