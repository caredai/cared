import type { BetterAuthOptions, LiteralUnion, Models } from 'better-auth'
import { headers } from 'next/headers'
import { db } from '@tavern/db/client'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { customSession, genericOAuth, openAPI } from 'better-auth/plugins'
import { v7 } from 'uuid'

import { getBaseUrl } from './client'
import { env } from './env'
import { KVClient } from './kv'

function generateId(prefix: string) {
  const uuid = v7() // time based, monotonically increasing order
  return `${prefix}_${uuid.replaceAll('-', '')}`
}

const options = {
  appName: 'CryptoTavern',
  baseURL: getBaseUrl(),
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 12, // 12 hours
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  ...(KVClient.getInstance() && {
    secondaryStorage: {
      get: async (key) => {
        const value = await KVClient.getInstance()!.get(key)
        return value ? value : null
      },
      set: async (key, value, ttl) => {
        await KVClient.getInstance()!.set(key, value, ttl)
      },
      delete: async (key) => {
        await KVClient.getInstance()!.delete(key)
      },
    },
  }),
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    storage: 'secondary-storage',
  },
  advanced: {
    // better-auth will use secure cookies in production (https site) by default
    // https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies#secure
    useSecureCookies: undefined,
    // Allow adding domain to the cookie
    // https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies#domain
    crossSubDomainCookies: {
      enabled: true,
    },
    cookiePrefix: 'tavern',
    generateId: ({ model }: { model: LiteralUnion<Models, string> }) =>
      generateId(modelPrefix(model)),
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'ownx',
          clientId: env.OWNX_CLIENT_ID,
          clientSecret: env.OWNX_CLIENT_SECRET,
          discoveryUrl: env.OWNX_DISCOVERY_URL,
        },
      ],
    }),
    openAPI(),
    // Make sure this is the last plugin in the array
    // https://www.better-auth.com/docs/integrations/next#server-action-cookies
    nextCookies(),
  ],
  onAPIError: {
    errorURL: undefined, // TODO
  },
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [
    ...options.plugins,
    // eslint-disable-next-line @typescript-eslint/require-await
    customSession(async ({ user, session }) => {
      // now both user and session will infer the fields added by plugins and your custom fields
      return {
        user,
        session,
      }
    }, options), // pass options here
  ],
})

Object.entries(auth.api).forEach(([key, _endpoint]) => {
  const endpoint = async (args: any) => {
    // @ts-ignore
    return _endpoint({
      ...args,
      headers: await headers(),
    })
  }
  Object.entries(_endpoint).forEach(([k, v]) => {
    // @ts-ignore
    endpoint[k] = v
  })
  // @ts-ignore
  auth.api[key] = endpoint
})

function modelPrefix(model: LiteralUnion<Models, string>) {
  switch (model) {
    case 'user':
      return 'user'
    case 'account':
      return 'acc'
    case 'session':
      return 'ses'
    case 'verification':
      return 'vrf'
    case 'rate-limit':
      return 'rl'
    default:
      return model.slice(0, 6)
  }
}
