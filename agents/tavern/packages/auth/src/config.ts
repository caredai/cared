import type { NextAuthConfig } from 'next-auth'
import { skipCSRFCheck } from '@auth/core'

import { env } from '../env'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      name: string
      email: string
      image: string
    }
  }
}

export const isSecureContext = env.NODE_ENV !== 'development'

export const authConfig = {
  session: {
    strategy: 'jwt',
  },
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
      checks: ['pkce', 'state'],
    },
  ],
  callbacks: {
    // @ts-ignore
    jwt: ({ token, profile, trigger }) => {
      // console.log(token, profile, trigger)
      return {
        ...token,
        ...(trigger === 'signIn' && {
          id: (profile as any).sub,
          username: (profile as any).preferred_username,
        }),
      }
    },
    // @ts-ignore
    session: ({ session, token }) => {
      // console.log(session, token)
      if (!('user' in session)) throw new Error('unreachable with session strategy')

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          username: token.username,
        },
      }
    },
  },
} satisfies NextAuthConfig
