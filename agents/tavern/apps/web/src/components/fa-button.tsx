import type { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core'
import type { ComponentProps } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { cn } from '@cared/ui/lib/utils'

export function FaButton({
  icon,
  btnSize = 'size-8',
  iconSize = '2x',
  isActive,
  className,
  ...props
}: ComponentProps<'button'> & {
  icon: IconProp
  btnSize?: string
  iconSize?: SizeProp
  isActive?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center text-[0.9375rem] text-ring transition-colors duration-200',
        !props.disabled && 'hover:text-foreground',
        isActive && 'text-foreground',
        btnSize,
        className,
      )}
      {...props}
    >
      <FontAwesomeIcon icon={icon} size={iconSize} className="fa-fw" />
    </button>
  )
}

export function FaButtonWithBadge({
  icon,
  badgeIcon,
  btnSize = 'size-8',
  iconSize = '2x',
  badgeSize = 'xs',
  badgeClassName,
  isActive,
  className,
  ...props
}: ComponentProps<'button'> & {
  icon: IconProp
  badgeIcon: IconProp
  btnSize?: string
  iconSize?: SizeProp
  badgeSize?: SizeProp
  badgeClassName?: string
  isActive?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center text-[0.9375rem] text-ring hover:text-foreground transition-colors duration-200 relative',
        isActive && 'text-foreground',
        btnSize,
        className,
      )}
      {...props}
    >
      <FontAwesomeIcon icon={icon} size={iconSize} className="fa-fw" />
      <FontAwesomeIcon
        icon={badgeIcon}
        size={badgeSize}
        className={cn('absolute -top-1 -right-1 fa-fw', badgeClassName)}
      />
    </button>
  )
}
