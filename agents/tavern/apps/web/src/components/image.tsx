'use client'

import type { StaticImageData } from 'next/image'
import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import Image from 'next/image'

import imageLoader from '@/image-loader'

export function RemoteImage(
  props: ComponentProps<typeof Image> & {
    fallbackSrc?: string | StaticImageData | { default: StaticImageData }
  },
) {
  const { src, fallbackSrc } = props
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    setError(null)
  }, [props.src])

  return (
    <Image
      {...props}
      loader={imageLoader}
      onError={setError}
      src={error && fallbackSrc ? fallbackSrc : src}
    />
  )
}

export function LocalImage(props: ComponentProps<typeof Image>) {
  return <Image {...props} />
}
