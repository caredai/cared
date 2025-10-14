import {
  adminClient,
  apiKeyClient,
  customSessionClient,
  genericOAuthClient,
  jwtClient,
  oidcClient,
  organizationClient,
  passkeyClient,
  twoFactorClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import type { auth } from './server'
import { env } from './env'

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: `${getApiPath()}/auth`,
  plugins: [
    customSessionClient<typeof auth>(),
    oidcClient(),
    jwtClient(),
    apiKeyClient(),
    twoFactorClient(),
    passkeyClient(),
    genericOAuthClient(),
    adminClient(),
    organizationClient(),
  ],
})

export const allowedSocialProviders = ['google', 'twitter', 'discord', 'github'] as const

export function getTrustedOrigins() {
  return [getApiUrl(), getWebUrl(), ...(env.BETTER_AUTH_TRUSTED_ORIGINS ?? [])]
}

export function getApiUrl(): string {
  if (env.VITE_API_URL) return env.VITE_API_URL
  // @ts-ignore
  if (globalThis.location?.origin) return globalThis.location.origin
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3001}`
}

export function getWebUrl(): string {
  if (env.VITE_WEB_URL) return env.VITE_WEB_URL
  // @ts-ignore
  if (globalThis.location?.origin) return globalThis.location.origin
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function getApiPath() {
  return hasSameUrl() ? '/api' : ''
}

export function hasSameUrl() {
  return getApiUrl() === getWebUrl()
}

export function hasSameRootDomain() {
  const apiUrl = new URL(getApiUrl())
  const webUrl = new URL(getWebUrl())
  return apiUrl.port === webUrl.port && getRootDomain(apiUrl) === getRootDomain(webUrl)
}

export function getRootDomain(url: string | URL) {
  if (typeof url === 'string') {
    url = new URL(url)
  }
  const domain = url.hostname
  const parts = domain.split('.')
  if (parts.length > 2) {
    // Simple heuristic: if the last part is short (e.g., "uk"), assume it's part of a multi-part TLD
    if (parts.at(-1)!.length <= 3 && parts.at(-2)!.length <= 3) {
      return parts.slice(-3).join('.') // For cases like "domain.co.uk"
    } else {
      return parts.slice(-2).join('.') // For cases like "domain.com"
    }
  } else {
    return domain
  }
}
