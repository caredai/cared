import type { ImageLoaderPropsWithConfig } from './image-config'
import { env } from '@/env'
import { findClosestQuality } from './find-closest-quality'
import { hasLocalMatch } from './match-local-pattern'
import { hasRemoteMatch } from './match-remote-pattern'

function defaultLoader({ config, src, width, quality }: ImageLoaderPropsWithConfig): string {
  if (env.NODE_ENV !== 'production') {
    const missingValues = []

    // these should always be provided but make sure they are
    if (!src) missingValues.push('src')
    if (!width) missingValues.push('width')

    if (missingValues.length > 0) {
      throw new Error(
        `Next Image Optimization requires ${missingValues.join(
          ', ',
        )} to be provided. Make sure you pass them as props to the \`next/image\` component. Received: ${JSON.stringify(
          { src, width, quality },
        )}`,
      )
    }

    if (src.startsWith('//')) {
      throw new Error(
        `Failed to parse src "${src}" on \`next/image\`, protocol-relative URL (//) must be changed to an absolute URL (http:// or https://)`,
      )
    }

    if (src.startsWith('/') && config.localPatterns) {
      if (env.NODE_ENV !== 'test') {
        if (!hasLocalMatch(config.localPatterns, src)) {
          throw new Error(
            `Invalid src prop (${src}) on \`next/image\` does not match \`images.localPatterns\` configured in your \`next.config.js\`\n` +
              `See more info: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`,
          )
        }
      }
    }

    if (!src.startsWith('/') && (config.domains || config.remotePatterns)) {
      let parsedSrc: URL
      try {
        parsedSrc = new URL(src)
      } catch (err) {
        console.error(err)
        throw new Error(
          `Failed to parse src "${src}" on \`next/image\`, if using relative image it must start with a leading slash "/" or be an absolute URL (http:// or https://)`,
        )
      }

      if (env.NODE_ENV !== 'test') {
        if (!hasRemoteMatch(config.domains!, config.remotePatterns!, parsedSrc)) {
          throw new Error(
            `Invalid src prop (${src}) on \`next/image\`, hostname "${parsedSrc.hostname}" is not configured under images in your \`next.config.js\`\n` +
              `See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host`,
          )
        }
      }
    }
  }

  const q = findClosestQuality(quality, config)

  return `${config.path}?url=${encodeURIComponent(src)}&w=${width}&q=${q}`
}

// We use this to determine if the import is the default loader
// or a custom loader defined by the user in next.config.js
defaultLoader.__next_img_default = true

export default defaultLoader
