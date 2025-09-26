import { mergeWithoutUndefined } from '@cared/shared'

import type { ImageLoader, ImageProps, StaticImageData } from './get-img-props'
import type { ImageConfigComplete, ImageLoaderProps } from './image-config'
import { Image } from '@/components/image-component'
import { imageConfig } from '@/lib/config'
import { getImgProps } from './get-img-props'
import { imageConfigDefault } from './image-config'
import defaultLoader from './image-loader'

/**
 * For more advanced use cases, you can call `getImageProps()`
 * to get the props that would be passed to the underlying `<img>` element,
 * and instead pass to them to another component, style, canvas, etc.
 *
 * Read more: [Next.js docs: `getImageProps`](https://nextjs.org/docs/app/api-reference/components/image#getimageprops)
 */
export function getImageProps(imgProps: ImageProps) {
  const { props } = getImgProps(imgProps, {
    defaultLoader: imageConfig.loaderFn || defaultLoader,
    // @ts-ignore
    imgConf: mergeWithoutUndefined<ImageConfigComplete>(imageConfigDefault, imageConfig),
  })
  // Normally we don't care about undefined props because we pass to JSX,
  // but this exported function could be used by the end user for anything
  // so we delete undefined props to clean it up a little.
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) {
      delete props[key as keyof typeof props]
    }
  }
  return { props }
}

export default Image

export type { ImageProps, ImageLoaderProps, ImageLoader, StaticImageData }
