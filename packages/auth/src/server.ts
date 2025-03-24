import type { Account as AuthAccount, BetterAuthOptions, LiteralUnion, Models } from 'better-auth'
import { createRandomStringGenerator } from '@better-auth/utils/random'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import {
  admin,
  apiKey,
  bearer,
  customSession,
  genericOAuth,
  jwt,
  oidcProvider,
  openAPI,
  organization,
  twoFactor,
} from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins/passkey'

import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { redis } from '@mindworld/db/redis'
import { Account } from '@mindworld/db/schema'
import { generateId } from '@mindworld/shared'

import { getBaseUrl } from './client'
import { env } from './env'

const options = {
  appName: 'Mind',
  baseURL: getBaseUrl(),
  basePath: '/api/auth',
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Always disable sign-in by id token, since it's so buggy in better-auth.
      disableIdTokenSignIn: true,
      mapProfileToUser: async (profile) => {
        await cacheProfileForAccount(profile.sub, profile)
      },
    },
    twitter: {
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
      disableIdTokenSignIn: true,
      mapProfileToUser: async (profile) => {
        await cacheProfileForAccount(profile.data.id, profile.data)
        return {
          // better-auth treat username as email by default, since Twitter doesn't provide email.
          // However, Twitter username (X handle) can be changed. We use the user id as email as a fallback.
          // https://docs.x.com/x-api/users/user-lookup-me#response-data-username
          // https://help.x.com/en/managing-your-account/change-x-handle
          email: profile.data.id,
        }
      },
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      disableIdTokenSignIn: true,
      mapProfileToUser: async (profile) => {
        await cacheProfileForAccount(profile.id, profile)
      },
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      disableIdTokenSignIn: true,
      mapProfileToUser: async (profile) => {
        await cacheProfileForAccount(profile.id.toString(), profile)
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: false,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  databaseHooks: {
    account: {
      create: {
        after: updateProfileForAccount,
      },
      update: {
        after: updateProfileForAccount,
      },
    },
  },
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
    cookiePrefix: 'mind',
    generateId: ({ model }: { model: LiteralUnion<Models, string> }) =>
      generateId(modelPrefix(model)),
  },
  plugins: [
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
        jwks_uri: '/jwks',
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
    // Make sure this is the last plugin in the array
    // https://www.better-auth.com/docs/integrations/next#server-action-cookies
    nextCookies(),
  ],
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

async function cacheProfileForAccount(id: string, profile: Record<string, any>) {
  await redis.set(`profile:${id}`, JSON.stringify(profile), { ex: 20 })
}

async function getProfileForAccount(id: string): Promise<string | null> {
  return await redis.get(`profile:${id}`)
}

async function updateProfileForAccount(account: AuthAccount) {
  const profile = await getProfileForAccount(account.accountId)
  if (profile) {
    await db
      .update(Account)
      .set({
        profile,
      })
      .where(eq(Account.accountId, account.accountId))
  }
}

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
