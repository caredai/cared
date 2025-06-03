import type { ChangeEvent, ComponentProps } from 'react'
import { useRef } from 'react'

import { cn } from '@ownxai/ui/lib/utils'

import { RemoteImage } from '@/components/image'
import defaultPng from '@/public/images/ai4.png'

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

export function CharacterGroupAvatar(
  allProps: ComponentProps<'div'> &
    Pick<ComponentProps<typeof RemoteImage>, 'src' | 'alt'> & {
      onFileChange?: (file?: File) => void
      characterAvatars: string[]
    },
) {
  const { src, alt, onFileChange, characterAvatars, ...props } = allProps

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
    return <CharacterAvatar src={src} alt={alt} onFileChange={onFileChange} {...props} />
  }

  // Get the first 4 avatars
  const avatars = characterAvatars.slice(0, 4)
  const avatarCount = avatars.length

  // If no avatars, return empty div
  if (avatarCount === 0) {
    return <CharacterAvatar src={defaultPng} alt={alt} onFileChange={onFileChange} {...props} />
  }

  // If only one avatar, render as single avatar
  if (avatarCount === 1) {
    return <CharacterAvatar src={avatars[0]!} alt={alt} onFileChange={onFileChange} {...props} />
  }

  return (
    <div
      {...props}
      className={cn(
        'relative flex h-13 w-13 m-1 shrink-0 overflow-hidden rounded-full',
        props.className,
      )}
    >
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
        {avatars.map((avatar, index) => {
          // For 3 avatars, skip the last position
          if (avatarCount === 3 && index === 3) return null

          return (
            <RemoteImage
              key={index}
              src={avatar}
              alt={`${alt} ${index + 1}`}
              width={26}
              height={26}
              className="aspect-square w-full h-full object-cover"
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
