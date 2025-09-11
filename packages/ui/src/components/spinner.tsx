import type { ComponentProps } from 'react'
import { LoaderCircle, LoaderIcon, LoaderPinwheel, RefreshCw } from 'lucide-react'

import { cn } from '../lib/utils'

export function Spinner({ className, ...props }: ComponentProps<typeof LoaderIcon>) {
  return <LoaderIcon className={cn('animate-spin', className)} {...props} />
}

export function CircleSpinner({ className, ...props }: ComponentProps<typeof LoaderCircle>) {
  return <LoaderCircle className={cn('animate-spin', className)} {...props} />
}

export function PinwheelSpinner({ className, ...props }: ComponentProps<typeof LoaderPinwheel>) {
  return <LoaderPinwheel className={cn('animate-spin', className)} {...props} />
}

export function RefreshCwSpinner({ className, ...props }: ComponentProps<typeof LoaderPinwheel>) {
  return <RefreshCw className={cn('animate-spin', className)} {...props} />
}
