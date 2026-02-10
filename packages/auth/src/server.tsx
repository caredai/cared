import type {
  Account as BetterAuthAccount,
  BetterAuthOptions,
  User as BetterAuthUser,
  LiteralUnion,
  Models,
} from 'better-auth'
import type { SecondaryStorage } from 'better-auth/db'
import { createRandomStringGenerator } from '@better-auth/utils/random'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
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
import { reactStartCookies } from 'better-auth/react-start'
import { sha256 } from 'viem'

import type { Transaction } from '@cared/db/client'
import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Account, AuthAccount, Member, User } from '@cared/db/schema'
import { emails, getEmailAddresses } from '@cared/email'
import InvitationEmail from '@cared/email/emails/invitation-email'
import ResetPasswordEmail from '@cared/email/emails/reset-password-email'
import VerificationEmail from '@cared/email/emails/verification-email'
import { getKV } from '@cared/kv'
import { generateId } from '@cared/shared'

import {
  getApiPath,
  getApiUrl,
  getRootDomain,
  getTrustedOrigins,
  getWebUrl,
  hasSameRootDomain,
} from './client'
import { env } from './env'
import { accountAc, accountRoles } from './permission'
import { customPlugin } from './plugin'

export const maxAccounts = 2
export const maxMembers = 100

const kv = getKV('auth')

const serverIdName = 'x-server-call-mark'
const serverId = sha256(new TextEncoder().encode(env.BETTER_AUTH_SECRET), 'hex')

export function authHeaders(headers: Headers) {
  const newHeaders = new Headers(headers)
  newHeaders.set(serverIdName, serverId)
  return newHeaders
}

function getOptions(
  tx?: Transaction,
  opts?: {
    useOriginalAccessControl: boolean
  },
) {
  return {
    appName: 'cared',
    baseURL: getApiUrl(),
    basePath: `${getApiPath()}/auth`,
    secret: env.BETTER_AUTH_SECRET,
    user: {
      additionalFields: {
        defaultAccountId: {
          type: 'string',
          required: false,
          returned: true,
          references: {
            model: 'organization',
            field: 'id',
            onDelete: 'no action',
          },
        },
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 12, // 12 hours
      },
      additionalFields: {
        geolocation: {
          type: 'string',
          required: false,
          returned: true,
        },
        activeOrganizationId: {
          type: 'string',
          required: false,
          returned: true,
          fieldName: 'activeAccountId',
        },
        activeTeamId: {
          type: 'string',
          required: false,
          returned: true,
        },
      },
      storeSessionInDatabase: false,
    },
    account: {
      modelName: 'authAccount',
      accountLinking: {
        enabled: true,
        allowDifferentEmails: false,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        const addresses = getEmailAddresses({
          from: 'hello',
          replyTo: 'support',
        })
        await emails.send({
          ...addresses,
          to: user.email,
          subject: '[Cared] Reset your password',
          react: (
            <ResetPasswordEmail link={url} user={user.name} supportEmail={addresses.support} />
          ),
        })
      },
      resetPasswordTokenExpiresIn: 3600, // 1 hour
      revokeSessionsOnPasswordReset: true,
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const addresses = getEmailAddresses({
          from: 'hello',
          replyTo: 'support',
        })
        await emails.send({
          ...addresses,
          to: user.email,
          subject: '[Cared] Verify your email address',
          react: <VerificationEmail link={url} user={user.name} supportEmail={addresses.support} />,
        })
      },
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600, // 1 hour
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
    database: drizzleAdapter(tx ?? db, {
      provider: 'pg',
      transaction: !tx,
      // debugLogs: env.NODE_ENV === 'development',
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user, _ctx, ...args) => {
            // @ts-ignore
            await createDefaultAccountIfAbsent(user, args.at(0)?.tx as Transaction | undefined)
          },
        },
      },
      account: {
        create: {
          after: updateProfileForAccount(tx),
        },
        update: {
          after: updateProfileForAccount(tx),
        },
      },
    },
    secondaryStorage: kv as SecondaryStorage,
    trustedOrigins: getTrustedOrigins(),
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
        domain: getRootDomain(getApiUrl()),
      },
      cookiePrefix: 'cared',
      ...(!hasSameRootDomain() && {
        defaultCookieAttributes: {
          sameSite: 'none',
          secure: true,
          httpOnly: true,
        },
      }),
      database: {
        generateId: ({ model }: { model: LiteralUnion<Models, string> }) =>
          generateId(modelPrefix(model)),
      },
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
      jwt({
        jwks: {
          keyPairConfig: {
            alg: 'RS256', // NOTE: Privy requires RS256
          },
        },
        // Disable setting jwt header in the `/get-session` after hook
        // https://github.com/better-auth/better-auth/blob/b0664526b0ded74caed07ef2e1310f2407526daf/packages/better-auth/src/plugins/jwt/index.ts#L235
        disableSettingJwtHeader: true,
      }),
      passkey(),
      twoFactor(),
      admin(),
      organization({
        ac: !opts?.useOriginalAccessControl ? accountAc : undefined,
        roles: !opts?.useOriginalAccessControl ? accountRoles : undefined,
        organizationLimit: maxAccounts,
        membershipLimit: maxMembers,
        teams: {
          enabled: true,
          defaultTeam: {
            enabled: false,
          },
          maximumTeams: 3,
          maximumMembersPerTeam: undefined,
          allowRemovingAllTeams: true,
        },
        invitationExpiresIn: 3600 * 24, // 24 hours
        invitationLimit: 100,
        cancelPendingInvitationsOnReInvite: true,
        requireEmailVerificationOnInvitation: true,
        async sendInvitationEmail(data) {
          const inviteLink = `${getWebUrl()}/${data.organization.id}/accept-invitation/${data.id}`
          await emails.send({
            ...getEmailAddresses({
              from: 'hello',
              replyTo: 'support',
            }),
            to: data.email,
            subject: `[Cared] Join account '${data.organization.name}'`,
            react: (
              <InvitationEmail
                link={inviteLink}
                inviter={data.inviter.user.name}
                accountName={data.organization.name}
              />
            ),
          })
        },
        organizationDeletion: {
          disabled: true, // TODO
        },
        organizationCreation: {
          disabled: false,
          // eslint-disable-next-line @typescript-eslint/require-await
          beforeCreate: async ({ organization, user: _ }, _request) => {
            const id = generateId('acc')
            return {
              data: {
                ...organization,
                // id, // since we cannot set `forceAllowId`
                slug: id, // better-auth requires slug to be unique
              },
            }
          },
          afterCreate: async ({ organization }) => {
            await (tx ?? db)
              .update(Account)
              .set({
                slug: organization.id,
              })
              .where(eq(Account.id, organization.id))
          },
        },
        autoCreateOrganizationOnSignUp: false,
        schema: {
          organization: {
            modelName: 'Account',
          },
          member: {
            fields: {
              organizationId: 'accountId',
            },
          },
          invitation: {
            fields: {
              organizationId: 'accountId',
            },
          },
          team: {
            fields: {
              organizationId: 'accountId',
            },
          },
        },
      }),
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
        /*
        metadata: {
          issuer: getBaseUrl(),
          authorization_endpoint: '/oauth2/authorize',
          token_endpoint: '/oauth2/token',
          userinfo_endpoint: '/oauth2/userinfo',
          jwks_uri: '/jwks',
        },
        */
      }),
      apiKey({
        apiKeyHeaders: 'X-API-KEY',
        customKeyGenerator: generateKey,
        customAPIKeyGetter: (ctx) => {
          let apiKey = ctx.headers?.get('X-API-KEY')
          if (!apiKey) {
            const bearerToken = ctx.headers?.get('Authorization')?.replace('Bearer ', '')
            if (bearerToken?.startsWith('sk_')) {
              apiKey = bearerToken
            }
          }
          return apiKey ? apiKey : null
        },
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
        enableSessionForAPIKeys: false,
      }),
      openAPI(),
      emailHarmony(),
      customPlugin(),
      // Make sure this is the last plugin in the array
      // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
      reactStartCookies(),
    ],
    onAPIError: {
      errorURL: getWebUrl() + '/auth/error',
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
          '/sign-up/email',
          '/sign-in/email',
          '/sign-in/social',
          '/sign-out',
          '/update-user',
          // '/get-session',
          '/revoke-session',
          '/revoke-sessions',
          '/revoke-other-sessions',
          '/link-social',
          '/unlink-account',
          '/send-verification-email',
          '/verify-email',
          '/request-password-reset',
          '/reset-password',
          '/change-password',
          '/organization/get-invitation',
          '/organization/accept-invitation',
          '/organization/reject-invitation',
          '/error', // TODO
          '/jwks',
          '/token',
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
        if (
          !allowedPaths.includes(ctx.path) &&
          !ctx.path.startsWith('/callback') &&
          !ctx.path.startsWith('/reset-password') // reset-password callback
        ) {
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

            await (tx ?? db)
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
    logger: {
      disabled: false,
      disableColors: false,
      level: 'error',
      log: (level, message, ...args) => {
        console.log(`[${level}] ${message}`, ...args)
      },
    },
    telemetry: { enabled: false },
  } satisfies BetterAuthOptions
}

export function getAuth(tx?: Transaction, opts?: Parameters<typeof getOptions>[1]) {
  const options = getOptions(tx, opts)

  return betterAuth({
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
}

export const auth = getAuth()

async function cacheProfileForAccount(id: string, profile: Record<string, any>) {
  await kv.set(`profile:${id}`, JSON.stringify(profile), { ex: 60 })
}

async function getProfileForAccount(id: string): Promise<string | null | undefined> {
  return await kv.get(`profile:${id}`)
}

function updateProfileForAccount(tx?: Transaction) {
  return async (account: BetterAuthAccount) => {
    const profile = await getProfileForAccount(account.accountId)
    if (profile) {
      await (tx ?? db)
        .update(AuthAccount)
        .set({
          profile,
        })
        .where(eq(AuthAccount.id, account.accountId))
    }
  }
}

export async function createDefaultAccountIfAbsent(user: BetterAuthUser, tx?: Transaction) {
  const create = async (tx: Transaction) => {
    const accountId = 'acc_' + user.id.split('_')[1]

    const dbUser = (await tx.select().from(User).where(eq(User.id, user.id)).for('update')).at(0)
    if (!dbUser) {
      throw new Error('User not found')
    }

    const account = await tx.query.Account.findFirst({
      where: eq(Account.id, accountId),
    })
    if (account) {
      throw new Error('Account already exists')
    }
    await tx.insert(Account).values({
      id: accountId,
      name: 'My Account',
      slug: accountId,
      createdAt: new Date(),
    })
    await tx.insert(Member).values({
      id: generateId('member'),
      accountId,
      userId: user.id,
      role: 'owner',
      createdAt: new Date(),
    })
    await tx
      .update(User)
      .set({
        defaultAccountId: accountId,
      })
      .where(eq(User.id, user.id))
    // NOTE: update user data
    // @ts-ignore
    user.defaultAccountId = accountId
  }

  if (tx) {
    return await create(tx)
  } else {
    return await db.transaction(async (tx) => await create(tx))
  }
}

function modelPrefix(model: LiteralUnion<Models, string>) {
  switch (model) {
    case 'user':
      return 'user'
    case 'account':
      return 'aac'
    case 'session':
      return 'ses'
    case 'verification':
      return 'vrf'
    case 'rateLimit':
      return 'rl'
    case 'organization':
      return 'acc'
    case 'member':
      return 'member'
    case 'invitation':
      return 'invite'
    case 'team':
      return 'team'
    case 'teamMember':
      return 'tm'
    case 'jwks':
      return 'jwks'
    case 'passkey':
      return 'passkey'
    case 'twoFactor':
      return '2fa'
    case 'oauthApplication':
      return 'oa'
    case 'oauthAccessToken':
      return 'oat'
    case 'oauthConsent':
      return 'oc'
    case 'apikey':
      return 'ak'
    default:
      return model.slice(0, 6)
  }
}

export const generateRandomString = createRandomStringGenerator('a-z', '0-9', 'A-Z', '-_')

export function generateKey({ length, prefix }: { length: number; prefix?: string }) {
  return (prefix ?? '') + generateRandomString(length, 'a-z', 'A-Z')
}
