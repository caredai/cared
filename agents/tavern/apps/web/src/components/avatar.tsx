import type { ChangeEvent, ComponentProps } from 'react'
import { useRef } from 'react'

import { cn } from '@ownxai/ui/lib/utils'

import { RemoteImage } from '@/components/image'

export function CharacterAvatar(
  allProps: ComponentProps<'div'> &
    Pick<ComponentProps<typeof RemoteImage>, 'src' | 'alt'> & {
      onFileChange?: (file?: File) => void
    },
) {
  const { src, alt, onFileChange, ...props } = allProps

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange?.(event.target.files?.[0])
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      {...props}
      className={cn(
        'relative flex h-13 w-13 m-1 shrink-0 overflow-hidden rounded-full cursor-pointer transition-all duration-200 hover:drop-shadow-[0px_0px_4px_rgba(225,138,36,1)]',
        props.className,
      )}
    >
      <RemoteImage
        src={src}
        alt={alt}
        width={52}
        height={52}
        className="aspect-square w-full h-full object-cover"
        onClick={() => {
          fileInputRef.current?.click()
        }}
      />

      {onFileChange && (
        // Hidden file input
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      )}
    </div>
  )
}
