import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import type { ComponentProps } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { cn } from '@ownxai/ui/lib/utils'

export function FaButton({
  icon,
  isActive,
  className,
  ...props
}: ComponentProps<'button'> & {
  icon: IconProp
  isActive?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center size-8 text-[0.9375rem] text-ring hover:text-foreground transition-colors duration-200',
        isActive && 'text-foreground',
        className,
      )}
      {...props}
    >
      <FontAwesomeIcon icon={icon} size="2x" className="fa-fw" />
    </button>
  )
}
