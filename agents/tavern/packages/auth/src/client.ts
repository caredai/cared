import { customSessionClient, genericOAuthClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import type { auth } from './server'
import { env } from './env'

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    customSessionClient<typeof auth>(),
    genericOAuthClient(),
  ],
})

export function getBaseUrl() {
  if (env.NEXT_PUBLIC_BASE_URL) return env.NEXT_PUBLIC_BASE_URL
  // @ts-ignore
  if (globalThis.location?.origin) return globalThis.location.origin
  // @ts-ignore
  if (!globalThis.window) {
    if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  }
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`
}
