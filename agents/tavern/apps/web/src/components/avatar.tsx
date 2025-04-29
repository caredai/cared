import type { ComponentProps } from 'react'

import { cn } from '@ownxai/ui/lib/utils'

import { RemoteImage } from '@/components/image'

export function CharacterAvatar(
  allProps: ComponentProps<'div'> & Pick<ComponentProps<typeof RemoteImage>, 'src' | 'alt'>,
) {
  const { src, alt, ...props } = allProps
  return (
    <div
      {...props}
      className={cn(
        'relative flex h-13 w-13 shrink-0 overflow-hidden rounded-full cursor-pointer',
        props.className,
      )}
    >
      <RemoteImage src={src} alt={alt} fill className="aspect-square h-full w-full object-cover" />
    </div>
  )
}
