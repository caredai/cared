import type { ComponentProps } from 'react'
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons'

import { Badge } from '@ownxai/ui/components/badge'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'

export function Tag({ className, children, ...props }: ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="outline"
      className={cn('text-muted-foreground border-ring px-1 py-0 rounded-sm', className)}
      {...props}
    >
      {children}
    </Badge>
  )
}

export function ClosableTag({ className, children, ...props }: ComponentProps<typeof Tag>) {
  return (
    <Tag
      className={cn('text-muted-foreground border-ring px-1 py-0 rounded-sm', className)}
      asChild
      {...props}
    >
      <div className="flex justify-between items-center gap-2">
        <span>{children}</span>
        <FaButton icon={faCircleXmark} btnSize="size-6" iconSize="xl" />
      </div>
    </Tag>
  )
}
