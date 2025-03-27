import type { Account as AuthAccount, BetterAuthOptions, LiteralUnion, Models } from 'better-auth'
import { headers as nextHeaders } from 'next/headers'
import { createRandomStringGenerator } from '@better-auth/utils/random'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
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
import { sha256 } from 'viem'

import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { Account, User } from '@mindworld/db/schema'
import { generateId } from '@mindworld/shared'

import { getBaseUrl } from './client'
import { env } from './env'
import { KVClient } from './kv'
import { customPlugin } from './plugin'

const serverIdName = 'x-server-call-mark'
const serverId = sha256(new TextEncoder().encode(env.BETTER_AUTH_SECRET), 'hex')

export async function headers() {
  const headers = new Headers(await nextHeaders())
  headers.set(serverIdName, serverId)
  return headers
}

const options = {
  appName: 'Mind',
  baseURL: getBaseUrl(),
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 12, // 12 hours
    },
    additionalFields: {
      geolocation: {
        type: 'string',
      },
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
    cookiePrefix: 'mind',
    generateId: ({ model }: { model: LiteralUnion<Models, string> }) =>
      generateId(modelPrefix(model)),
    ipAddress: {
      ipAddressHeaders: [
        'cf-connecting-ip', // get real client ip from Cloudflare
        'x-client-ip',
        'x-forwarded-for',
        'fastly-client-ip',
        'x-real-ip',
        'x-cluster-client-ip',
        'x-forwarded',
        'forwarded-for',
        'forwarded',
      ],
    },
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
        issuer: getBaseUrl(),
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
    customPlugin(),
    // Make sure this is the last plugin in the array
    // https://www.better-auth.com/docs/integrations/next#server-action-cookies
    nextCookies(),
  ],
  onAPIError: {
    errorURL: undefined, // TODO
  },
  hooks: {
    // eslint-disable-next-line @typescript-eslint/require-await
    before: createAuthMiddleware(async (ctx) => {
      // Always OK for the server call itself
      if (ctx.headers?.get(serverIdName) === serverId) {
        ctx.headers.delete(serverIdName)
        return
      }

      const allowedPaths = [
        '/sign-in/social',
        '/sign-out',
        '/update-user',
        '/revoke-session',
        '/revoke-sessions',
        '/revoke-other-sessions',
        '/link-social',
        '/unlink-account',
        '/error', // TODO
        '/.well-known/openid-configuration',
        '/oauth2/authorize',
        '/oauth2/consent',
        '/oauth2/token',
        '/oauth2/userinfo',
        ...(env.NODE_ENV === 'development'
          ? [
              '/reference',
            ]
          : []),
      ]
      if (!allowedPaths.includes(ctx.path) && !ctx.path.startsWith('/callback')) {
        throw new APIError('NOT_FOUND')
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // https://developers.cloudflare.com/rules/transform/managed-transforms/reference/#add-visitor-location-headers
      if (ctx.path.startsWith('/callback')) {
        const headers = ctx.headers
        if (!headers) {
          return
        }
        const session = ctx.context.newSession
        if (!session) {
          return
        }

        let update = false

        if (
          env.ADMIN_USER_EMAIL &&
          session.user.email === env.ADMIN_USER_EMAIL &&
          session.user.role !== 'admin'
        ) {
          update = true
          session.user.role = 'admin'

          await db
            .update(User)
            .set({
              role: 'admin',
            })
            .where(eq(User.id, session.user.id))
        }

        const city = headers.get('cf-ipcity')
        const region = headers.get('cf-region')
        const country = headers.get('cf-ipcountry')
        if (city || region || country) {
          update = true
          session.session.geolocation = JSON.stringify({
            city,
            region,
            country,
          })
        }

        if (update) {
          await setSessionCookie(ctx, session)
        }
      }
    }),
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

async function cacheProfileForAccount(id: string, profile: Record<string, any>) {
  await KVClient.getInstance()?.set(`profile:${id}`, JSON.stringify(profile), 60)
}

async function getProfileForAccount(id: string): Promise<string | null | undefined> {
  return KVClient.getInstance()?.get(`profile:${id}`)
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
