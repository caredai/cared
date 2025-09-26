import type { ImageConfig } from '@/lib/image/image-config'
import imageLoader from '@/image-loader'

export const imageConfig: ImageConfig = {
  loader: 'custom',
  loaderFn: imageLoader,
}
