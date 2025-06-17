import type { ChangeEvent, ComponentProps } from 'react'
import { useRef } from 'react'

import { cn } from '@ownxai/ui/lib/utils'

import { RemoteImage } from '@/components/image'
import defaultPng from '@/public/images/ai4.png'

export function CharacterAvatar(
  allProps: ComponentProps<'div'> &
    Pick<ComponentProps<typeof RemoteImage>, 'src' | 'alt'> & {
      onFileChange?: (file?: File) => void
      outline?: boolean
    },
) {
  const { src, alt, onFileChange, outline, ...props } = allProps

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
        outline && 'outline-2 outline-yellow-500',
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

export function CharacterGroupAvatar(
  allProps: ComponentProps<'div'> &
    Partial<Pick<ComponentProps<typeof RemoteImage>, 'src'>> &
    Pick<ComponentProps<typeof RemoteImage>, 'alt'> & {
      onFileChange?: (file?: File) => void
      characterAvatars?: string[]
      outline?: boolean
    },
) {
  const { src, alt, onFileChange, characterAvatars, outline, ...props } = allProps

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange?.(event.target.files?.[0])
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // If src exists, render as single avatar
  if (src) {
    return (
      <CharacterAvatar
        src={src}
        alt={alt}
        onFileChange={onFileChange}
        outline={outline}
        {...props}
      />
    )
  }

  // Get the first 4 avatars
  const avatars = characterAvatars?.slice(0, 4)
  const avatarCount = avatars?.length ?? 0

  // If no avatars, return empty div
  if (avatarCount === 0) {
    return (
      <CharacterAvatar
        src={defaultPng}
        alt={alt}
        onFileChange={onFileChange}
        outline={outline}
        {...props}
      />
    )
  }

  // If only one avatar, render as single avatar
  if (avatarCount === 1) {
    return (
      <CharacterAvatar
        src={avatars![0]!}
        alt={alt}
        onFileChange={onFileChange}
        outline={outline}
        {...props}
      />
    )
  }

  return (
    <div
      {...props}
      className={cn(
        'relative flex h-13 w-13 m-1 shrink-0 overflow-hidden rounded-full',
        props.className,
        outline && 'outline-2 outline-yellow-500',
      )}
    >
      <div
        className={cn(
          'grid grid-cols-2 w-full h-full',
          avatarCount === 2 && 'grid-rows-1',
          avatarCount === 4 && 'grid-rows-2',
        )}
      >
        {avatars?.map((avatar, index) => {
          return (
            <RemoteImage
              key={index}
              src={avatar}
              alt={`${alt} ${index + 1}`}
              width={26}
              height={26}
              className={cn(
                'aspect-square w-full h-full object-cover',
                avatarCount === 3 && index === 2 && 'col-span-2',
                index === 0 && 'border-r',
                index === 0 && avatarCount > 2 && 'border-b',
                index === 1 && 'border-l',
                index === 1 && avatarCount > 2 && 'border-b',
                index === 2 && 'border-t',
                index === 2 && avatarCount > 3 && 'border-r',
                index === 3 && 'border-t border-l',
              )}
            />
          )
        })}
      </div>

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
