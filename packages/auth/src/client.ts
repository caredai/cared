import {
  adminClient,
  apiKeyClient,
  customSessionClient,
  genericOAuthClient,
  oidcClient,
  organizationClient,
  passkeyClient,
  twoFactorClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import type { auth } from './server'
import { env } from './env'

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    customSessionClient<typeof auth>(),
    oidcClient(),
    apiKeyClient(),
    twoFactorClient(),
    passkeyClient(),
    genericOAuthClient(),
    adminClient(),
    organizationClient(),
  ],
})

export const allowedProviders = ['google', 'twitter', 'discord', 'github'] as const

export function getBaseUrl() {
  // @ts-ignore
  if (globalThis.location?.origin) return globalThis.location.origin
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`
}
