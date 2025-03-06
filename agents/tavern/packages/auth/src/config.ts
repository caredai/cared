import type { DefaultSession, NextAuthConfig, Session as NextAuthSession } from 'next-auth'
import { skipCSRFCheck } from '@auth/core'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@tavern/db/client'
import { Account, Session, User } from '@tavern/db/schema'

import { env } from '../env'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

const adapter = DrizzleAdapter(db, {
  usersTable: User,
  accountsTable: Account,
  sessionsTable: Session,
})

export const isSecureContext = env.NODE_ENV !== 'development'

export const authConfig = {
  adapter,
  // In development, we need to skip checks to allow Expo to work
  ...(!isSecureContext
    ? {
        skipCSRFCheck: skipCSRFCheck,
        trustHost: true,
      }
    : {}),
  secret: env.AUTH_SECRET,
  providers: [
    {
      id: 'mind', // signIn("mind") and will be part of the callback URL
      name: 'Mind AI', // optional, used on the default login page as the button text.
      type: 'oidc', // or "oauth" for OAuth 2 providers
      issuer: env.AUTH_MIND_ISSUER, // to infer the .well-known/openid-configuration URL
      clientId: env.AUTH_MIND_ID, // from the provider's dashboard
      clientSecret: env.AUTH_MIND_SECRET, // from the provider's dashboard
    },
  ],
  callbacks: {
    session: (opts) => {
      if (!('user' in opts)) throw new Error('unreachable with session strategy')

      return {
        ...opts.session,
        user: {
          ...opts.session.user,
          id: opts.user.id,
        },
      }
    },
  },
  debug: true,
} satisfies NextAuthConfig

export const validateToken = async (token: string): Promise<NextAuthSession | null> => {
  const sessionToken = token.slice('Bearer '.length)
  const session = await adapter.getSessionAndUser?.(sessionToken)
  return session
    ? {
        user: {
          ...session.user,
        },
        expires: session.session.expires.toISOString(),
      }
    : null
}

export const invalidateSessionToken = async (token: string) => {
  const sessionToken = token.slice('Bearer '.length)
  await adapter.deleteSession?.(sessionToken)
}
