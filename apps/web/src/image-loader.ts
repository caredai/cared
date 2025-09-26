'use client'

import { env } from './env'

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  if (!env.VITE_IMAGE_URL || !src.startsWith(env.VITE_IMAGE_URL)) {
    return src
  }
  const params = [`width=${width}`, `quality=${quality ?? 75}`, 'format=auto']
  return `${env.VITE_IMAGE_URL}/cdn-cgi/image/${params.join(',')}/${src}`
}
