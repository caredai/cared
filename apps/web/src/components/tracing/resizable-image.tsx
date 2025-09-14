import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon, ImageOff, Maximize2, Minimize2 } from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { cn } from '@cared/ui/lib/utils'

import imageLoader from '@/image-loader'

const ImageErrorDisplay = ({ src, displayError }: { src: string; displayError: string }) => (
  <div className="grid grid-cols-[auto,1fr] items-center gap-2">
    <span title={displayError} className="h-4 w-4">
      <ImageOff className="h-4 w-4" />
    </span>
    <Link href={src} className="truncate text-sm underline" target="_blank">
      {src}
    </Link>
  </div>
)

export const ResizableImage = ({
  src,
  alt,
  isDefaultVisible = false,
}: {
  src: string
  alt?: string
  isDefaultVisible?: boolean
}) => {
  const [isZoomedIn, setIsZoomedIn] = useState(true)
  const [hasFetchError, setHasFetchError] = useState(false)
  const [isImageVisible, setIsImageVisible] = useState(isDefaultVisible)

  const displayError = `Cannot load image. ${src.includes('http') ? 'Http images are not rendered in Langfuse for security reasons' : 'Invalid image URL'}`

  return (
    <div>
      {hasFetchError ? (
        <ImageErrorDisplay src={src} displayError={displayError} />
      ) : (
        <div
          className={cn(
            'group relative w-full overflow-hidden',
            isZoomedIn ? 'h-1/2 w-1/2' : 'h-full w-full',
          )}
        >
          {isImageVisible ? (
            <>
              <Image
                loader={imageLoader}
                src={src}
                alt={alt ?? `Markdown Image-${Math.random()}`}
                loading="lazy"
                width={0}
                height={0}
                title={src}
                className="h-full w-full rounded border object-contain"
                onError={() => {
                  setHasFetchError(true)
                }}
              />
              <Button
                type="button"
                className="absolute right-0 top-0 mr-1 mt-1 h-8 w-8 opacity-0 group-hover:!bg-accent/30 group-hover:opacity-100"
                variant="ghost"
                size="icon"
                onClick={() => setIsZoomedIn(!isZoomedIn)}
              >
                {isZoomedIn ? (
                  <Maximize2 className="h-4 w-4"></Maximize2>
                ) : (
                  <Minimize2 className="h-4 w-4"></Minimize2>
                )}
              </Button>
            </>
          ) : (
            <div className="grid h-14 w-full grid-cols-[auto,1fr] items-center gap-2 rounded border border-dashed bg-muted/30 p-2 text-xs text-muted-foreground/60">
              <Button
                title="Render image"
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setIsImageVisible(!isImageVisible)}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <div className="flex items-center overflow-hidden">
                <Link href={src} title={src} className="overflow-hidden underline" target="_blank">
                  <div className="h-8 overflow-hidden overflow-ellipsis">{src}</div>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
