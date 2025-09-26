import picomatch from 'picomatch'

import type { RemotePattern } from './image-config'

// Modifying this function should also modify writeImagesManifest()
export function matchRemotePattern(pattern: RemotePattern | URL, url: URL): boolean {
  if (pattern.protocol !== undefined) {
    if (pattern.protocol.replace(/:$/, '') !== url.protocol.replace(/:$/, '')) {
      return false
    }
  }
  if (pattern.port !== undefined) {
    if (pattern.port !== url.port) {
      return false
    }
  }

  if (!pattern.hostname) {
    throw new Error(`Pattern should define hostname but found\n${JSON.stringify(pattern)}`)
  } else {
    if (!picomatch.makeRe(pattern.hostname).test(url.hostname)) {
      return false
    }
  }

  if (pattern.search !== undefined) {
    if (pattern.search !== url.search) {
      return false
    }
  }

  // Should be the same as writeImagesManifest()
  if (!picomatch.makeRe(pattern.pathname ?? '**', { dot: true }).test(url.pathname)) {
    return false
  }

  return true
}

export function hasRemoteMatch(
  domains: string[],
  remotePatterns: (RemotePattern | URL)[],
  url: URL,
): boolean {
  return (
    domains.some((domain) => url.hostname === domain) ||
    remotePatterns.some((p) => matchRemotePattern(p, url))
  )
}
