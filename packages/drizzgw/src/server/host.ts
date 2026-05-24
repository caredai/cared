import { env } from '../env.js'

export interface ParsedGatewayHost {
  namespaceIdNoPrefix: string
  namespaceId: string
  branchId: string
  branchKey: string
}

/**
 * Parses `<namespaceIdNoPrefix>-<branchId>.{DOMAIN_SUFFIX}` from the Host header.
 */
export function parseGatewayHost(hostHeader: string | undefined): ParsedGatewayHost | null {
  if (!hostHeader) {
    return null
  }

  const host = hostHeader.split(':')[0]?.toLowerCase()
  if (!host) {
    return null
  }

  const suffix = env.DOMAIN_SUFFIX.toLowerCase()
  if (!host.endsWith(`.${suffix}`)) {
    return null
  }

  const subdomain = host.slice(0, -(suffix.length + 1))
  const match = /^([0-9a-f]{32})-([a-z0-9-]{1,60})$/.exec(subdomain)
  if (!match) {
    return null
  }

  const namespaceIdNoPrefix = match[1]!
  const branchId = match[2]!
  const namespaceId = `neon_${namespaceIdNoPrefix}`

  return {
    namespaceIdNoPrefix,
    namespaceId,
    branchId,
    branchKey: `${namespaceIdNoPrefix}-${branchId}`,
  }
}
