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
