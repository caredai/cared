import type { ComponentProps, ReactNode } from 'react'

import {
  InputBase,
  InputBaseControl,
  InputBaseFlexWrapper,
  InputBaseInput,
} from '@cared/ui/components/input-base'
import { cn } from '@cared/ui/lib/utils'

type InputWithEndActionProps = ComponentProps<typeof InputBaseInput> & {
  endAction: ReactNode
  wrapperClassName?: string
}

/**
 * Input field with a trailing action that stays outside the text area.
 */
export function InputWithEndAction({
  endAction,
  wrapperClassName,
  className,
  ...inputProps
}: InputWithEndActionProps) {
  return (
    <InputBase className={cn('max-w-3xl', wrapperClassName)}>
      <InputBaseFlexWrapper className="min-w-0 items-center gap-1">
        <InputBaseControl>
          <InputBaseInput className={cn('min-w-0', className)} {...inputProps} />
        </InputBaseControl>
        <div className="shrink-0">{endAction}</div>
      </InputBaseFlexWrapper>
    </InputBase>
  )
}
