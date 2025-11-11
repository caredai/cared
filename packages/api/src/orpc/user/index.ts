import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { auth, authHeaders } from '@cared/auth'
import { and, desc, eq, inArray } from '@cared/db'
import { db } from '@cared/db/client'
import {
  Account,
  App,
  AuthAccount,
  Member,
  OAuthAccessToken,
  OAuthApplication,
  OAuthConsent,
  User,
} from '@cared/db/schema'

import { invalidateAccessTokensCache } from '../../operation/oauth-app'
import { publicProcedure, userProtectedProcedure } from '../../orpc'
import { forwardSetCookieHeader } from '../../utils'
import { formatOAuthApp } from '../account/oauth-app'

export interface Session {
  session: Omit<(typeof auth.$Infer.Session)['session'], 'activeOrganizationId'> & {
    activeAccountId?: string | null
  }
  user: (typeof auth.$Infer.Session)['user']
}

function formatSession(session: (typeof auth.$Infer.Session)['session']) {
  const { activeOrganizationId, ...props } = session

  const sess: Session['session'] = {
    ...props,
    activeAccountId: activeOrganizationId,
  }

  return sess
}

export const userRouter = {
  session: publicProcedure
    .route({
      method: 'GET',
      path: '/v1/user/session',
      tags: ['me'],
      summary: 'Get current session of current user',
    })
    .input(
      z
        .object({
          auth: z.boolean(),
        })
        .default({
          auth: true,
        }),
    )
    .handler(async ({ context, input }) => {
      if (input.auth) {
        if (!context.auth.isUser) {
          throw new ORPCError('UNAUTHORIZED')
        }
      }

      const result = await auth.api.getSession({
        returnHeaders: true,
        headers: authHeaders(context.headers),
      })
      const resHeaders = result.headers
      const session = result.response

      // Create default account if not exists
      if (session && !session.user.defaultAccountId) {
        // Should not happen
        throw new ORPCError('INTERNAL_SERVER_ERROR')
      }

      if (input.auth && !session) {
        throw new ORPCError('UNAUTHORIZED')
      }

      forwardSetCookieHeader(context.resHeaders, resHeaders)

      if (!session) {
        return null
      }

      const sess: Session = {
        session: formatSession(session.session),
        user: session.user,
      }

      return sess
    }),

  authAccounts: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/user/auth-accounts',
      tags: ['me'],
      summary: 'Get linked authentication accounts of current user',
    })
    .handler(async ({ context }) => {
      if (!context.auth.userId) {
        throw new ORPCError('FORBIDDEN', {
          message: 'This api is only available for authenticated users',
        })
      }

      const authAccounts = await db.query.AuthAccount.findMany({
        where: eq(AuthAccount.userId, context.auth.userId),
      })

      return { authAccounts }
    }),

  sessions: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/user/sessions',
      tags: ['me'],
      summary: 'Get sessions of current user',
    })
    .handler(async ({ context }) => {
      if (!context.auth.userId) {
        throw new ORPCError('FORBIDDEN', {
          message: 'This api is only available for authenticated users',
        })
      }

      const sessions = (await auth.api.customListSessions({
        headers: authHeaders(context.headers),
      })) as (typeof auth.$Infer.Session)['session'][]

      return {
        sessions: sessions.map((session) => ({
          ...formatSession(session),
          geolocation: session.geolocation
            ? (JSON.parse(session.geolocation) as {
                city?: string
                region?: string
                country?: string
              })
            : undefined,
        })),
      }
    }),

  oauthApps: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/v1/user/oauth-apps',
      tags: ['me'],
      summary: 'Get authorized OAuth apps for current user',
    })
    .handler(async ({ context }) => {
      const sqlClientIds = db
        .selectDistinct({
          clientId: OAuthAccessToken.clientId,
          createdAt: OAuthAccessToken.createdAt,
          updatedAt: OAuthAccessToken.updatedAt,
        })
        .from(OAuthAccessToken)
        .where(eq(OAuthAccessToken.userId, context.auth.userId))
        .orderBy(desc(OAuthAccessToken.updatedAt), desc(OAuthAccessToken.createdAt))
        .as('sqlClientIds')

      const oauthApps = (
        await db
          .select({
            oauthApp: OAuthApplication,
            createdAt: sqlClientIds.createdAt,
            updatedAt: sqlClientIds.updatedAt,
          })
          .from(sqlClientIds)
          .innerJoin(OAuthApplication, eq(OAuthApplication.clientId, sqlClientIds.clientId))
      ).map((a) => formatOAuthApp(a.oauthApp))

      const apps = await db
        .select({
          app: App,
          account: Account,
          owner: User,
        })
        .from(App)
        .innerJoin(Account, eq(Account.id, App.accountId))
        .innerJoin(Member, and(eq(Member.accountId, Account.id), eq(Member.role, 'owner')))
        .innerJoin(User, eq(User.id, Member.userId))
        .where(
          inArray(
            App.id,
            oauthApps.map((a) => a.appId),
          ),
        )

      const oauthAppsMap = new Map(oauthApps.map((a) => [a.appId, a]))

      return {
        apps: apps.map(({ app, account, owner }) => {
          const oauthApp = oauthAppsMap.get(app.id)!
          return {
            clientId: oauthApp.clientId,
            access: {
              createdAt: oauthApp.createdAt,
              updatedAt: oauthApp.updatedAt,
            },
            appId: app.id,
            name: app.name,
            imageUrl: app.metadata.imageUrl,
            account: {
              id: account.id,
              name: account.name,
            },
            owner: {
              id: owner.id,
              name: owner.name,
            },
          }
        }),
      }
    }),

  revokeOauthApp: userProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/user/oauth-apps/{clientId}',
      tags: ['me'],
      summary: 'Revoke access token for a specific OAuth app',
    })
    .input(
      z.object({
        clientId: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await db.transaction(async (tx) => {
        await tx
          .delete(OAuthConsent)
          .where(
            and(
              eq(OAuthConsent.userId, context.auth.userId),
              eq(OAuthConsent.clientId, input.clientId),
            ),
          )

        const tokens = await tx
          .delete(OAuthAccessToken)
          .where(
            and(
              eq(OAuthAccessToken.userId, context.auth.userId),
              eq(OAuthAccessToken.clientId, input.clientId),
            ),
          )
          .returning()

        await invalidateAccessTokensCache(...tokens.map((t) => t.accessToken!))
      })
    }),
}
