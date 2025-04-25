import type { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core'
import type { ComponentProps } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@ownxai/ui/components/tooltip'
import { cn } from '@ownxai/ui/lib/utils'

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
        'inline-flex items-center justify-center text-[0.9375rem] text-ring hover:text-foreground transition-colors duration-200',
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

export function TooltipFaButton({
  icon,
  btnSize,
  iconSize,
  isActive,
  tooltip,
  className,
  ...props
}: ComponentProps<'button'> & {
  icon: IconProp
  btnSize?: string
  iconSize?: SizeProp
  isActive?: boolean
  tooltip?: string
}) {
  return tooltip ? (
      <Tooltip delayDuration={1000}>
        <TooltipTrigger asChild>
          <FaButton
            icon={icon}
            btnSize={btnSize}
            iconSize={iconSize}
            isActive={isActive}
            className={className}
            {...props}
          />
        </TooltipTrigger>
        <TooltipContent className="z-5000">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
  ) : (
    <FaButton
      icon={icon}
      btnSize={btnSize}
      iconSize={iconSize}
      isActive={isActive}
      className={className}
      {...props}
    />
  )
}
