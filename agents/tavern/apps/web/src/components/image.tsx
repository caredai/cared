'use client'

import type { ComponentProps } from 'react'
import Image from 'next/image'

import imageLoader from '@/image-loader'

export function RemoteImage(props: ComponentProps<typeof Image>) {
  return <Image {...props} loader={imageLoader} />
}

export function LocalImage(props: ComponentProps<typeof Image>) {
  return <Image {...props} />
}
