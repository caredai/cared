import { Portal } from '@radix-ui/react-hover-card'
import { Info } from 'lucide-react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@cared/ui/components/hover-card'
import { cn } from '@cared/ui/lib/utils'

export interface DocPopupProps {
  description: React.ReactNode
  href?: string
  className?: string
}

export default function DocPopup({ description, href, className }: DocPopupProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger className={cn('mx-1', href ? 'cursor-pointer' : 'cursor-default')} asChild>
        <div
          className="inline-block whitespace-nowrap text-muted-foreground sm:pl-0"
          onClick={(e) => {
            if (!href) return
            e.preventDefault()
            e.stopPropagation()
            window.open(href, '_blank')
          }}
        >
          <Info className={'h-3 w-3'} />
        </div>
      </HoverCardTrigger>
      <Portal>
        <HoverCardContent>
          {typeof description === 'string' ? (
            <div
              className={cn(
                'whitespace-break-spaces text-xs font-normal text-primary sm:pl-0',
                className,
              )}
            >
              {description}
            </div>
          ) : (
            description
          )}
        </HoverCardContent>
      </Portal>
    </HoverCard>
  )
}

export interface PopupProps {
  triggerContent: React.ReactNode
  description: React.ReactNode
}

export function Popup({ triggerContent, description }: PopupProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger className="mx-1 cursor-pointer" asChild>
        <div>{triggerContent}</div>
      </HoverCardTrigger>
      <HoverCardContent>
        {typeof description === 'string' ? (
          <div className="whitespace-break-spaces text-xs font-normal text-primary sm:pl-0">
            {description}
          </div>
        ) : (
          description
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
