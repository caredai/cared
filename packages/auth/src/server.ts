import type { LiteralUnion, Models } from 'better-auth'
import { createRandomStringGenerator } from '@better-auth/utils/random'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import {
  admin,
  apiKey,
  bearer,
  genericOAuth,
  jwt,
  oidcProvider,
  openAPI,
  organization,
  twoFactor,
} from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins/passkey'

import { db } from '@mindworld/db/client'
import { redis } from '@mindworld/db/redis'
import { generateId } from '@mindworld/shared'

import { getBaseUrl } from './client'
import { env } from './env'

export const auth = betterAuth({
  appName: 'Mind',
  baseURL: getBaseUrl(),
  basePath: '/api/auth',
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    twitter: {
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secondaryStorage: {
    get: async (key) => {
      const value = await redis.get<string>(key)
      return value ? value : null
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, { ex: ttl })
      else await redis.set(key, value)
    },
    delete: async (key) => {
      await redis.del(key)
    },
  },
  advanced: {
    generateId: ({ model }: { model: LiteralUnion<Models, string> }) =>
      generateId(modelPrefix(model)),
  },
  plugins: [
    nextCookies(),
    bearer(),
    jwt(),
    passkey(),
    twoFactor(),
    admin(),
    organization(),
    genericOAuth({
      config: [],
    }),
    oidcProvider({
      accessTokenExpiresIn: 7200, // 2 hours
      refreshTokenExpiresIn: 604800, // 1 week
      codeExpiresIn: 600, // 10 minutes
      allowDynamicClientRegistration: false,
      requirePKCE: true,
      loginPage: '/auth/sign-in',
      consentPage: '/auth/oauth2/consent',
      metadata: {
        issuer: env.NEXT_PUBLIC_MIND_URL,
        authorization_endpoint: '/oauth2/authorize',
        token_endpoint: '/oauth2/token',
        userinfo_endpoint: '/oauth2/userinfo',
        jwks_uri: '/jwks'
      },
    }),
    apiKey({
      apiKeyHeaders: 'X-API-KEY',
      defaultPrefix: 'sk_',
      minimumNameLength: 0,
      maximumNameLength: 64,
      enableMetadata: true,
      // Only applies to the verification process for a given API key
      rateLimit: {
        enabled: true,
        timeWindow: 1000 * 60, // 1 minute
        maxRequests: 100,
      },
    }),
    openAPI(),
    emailHarmony(),
  ],
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
    case 'organization':
      return 'org'
    case 'member':
      return 'member'
    case 'invitation':
      return 'invite'
    case 'jwks':
      return 'jwks'
    case 'passkey':
      return 'passkey'
    case 'two-factor':
      return '2fa'
    default:
      return model.slice(0, 6)
  }
}

export const generateRandomString = createRandomStringGenerator('a-z', '0-9', 'A-Z', '-_')
