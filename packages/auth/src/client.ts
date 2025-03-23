import { apiKeyClient, oidcClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    oidcClient(),
    apiKeyClient(),
  ],
})

export const allowedProviders = ['google', 'twitter', 'discord', 'github'] as const

export function getBaseUrl() {
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`
}
