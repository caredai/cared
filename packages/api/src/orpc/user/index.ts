import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { auth, authHeaders, getAuth } from '@cared/auth'
import { and, desc, eq, inArray, or } from '@cared/db'
import { db } from '@cared/db/client'
import {
  Account,
  AuthAccount,
  Member,
  OAuthAccessToken,
  OAuthApp,
  OAuthConsent,
  OAuthRefreshToken,
  User,
} from '@cared/db/schema'

import type { Session } from '../../types'
import {
  getOAuthAppByClientId,
  invalidateAccessTokensCache,
  invalidateUserAccounts,
} from '../../operation'
import { publicProcedure, userProtectedProcedure } from '../../orpc'
import { formatInvitation, formatOAuthApp } from '../../types'
import { forwardSetCookieHeader } from '../../utils'

function formatSession(session: (typeof auth.$Infer.Session)['session']) {
  const { geolocation, ...props } = session

  const sess: Session['session'] = {
    ...props,
    geolocation: geolocation
      ? (JSON.parse(geolocation) as {
          city?: string
          region?: string
          country?: string
        })
      : undefined,
  }

  return sess
}

export const userRouter = {
  session: publicProcedure
    .route({
      method: 'GET',
      path: '/user/session',
      tags: ['user'],
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
      path: '/user/auth-accounts',
      tags: ['user'],
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
      path: '/user/sessions',
      tags: ['user'],
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
        sessions: sessions.map(formatSession),
      }
    }),

  setActiveAccount: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/user/active-account',
      tags: ['user'],
      summary: 'Set active account for current user',
    })
    .input(
      z.object({
        id: z.string().min(32).nullable(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { headers: resHeaders, response: account } = await getAuth({
        useOriginalAccessControl: true,
      }).api.setActiveOrganization({
        returnHeaders: true,
        headers: authHeaders(context.headers),
        body: {
          organizationId: input.id,
        },
      })
      if (!account && input.id) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to set active account',
        })
      }
      forwardSetCookieHeader(context.resHeaders, resHeaders)
    }),

  accountInvitations: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/user/account-invitations',
      tags: ['user'],
      summary: 'List pending account invitations for current user',
    })
    .handler(async ({ context }) => {
      const invitations = await getAuth({
        useOriginalAccessControl: true,
      }).api.listUserInvitations({
        headers: authHeaders(context.headers),
      })
      return { invitations: invitations.map(formatInvitation) }
    }),

  acceptAccountInvitation: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/user/account-invitations/{invitationId}/accept',
      tags: ['user'],
      summary: 'Accept account invitation',
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const res = await getAuth({
        useOriginalAccessControl: true,
      }).api.acceptInvitation({
        headers: authHeaders(context.headers),
        body: { invitationId: input.invitationId },
      })

      await invalidateUserAccounts(res.member.userId)

      return { invitation: formatInvitation(res.invitation) }
    }),

  rejectAccountInvitation: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/user/account-invitations/{invitationId}/reject',
      tags: ['user'],
      summary: 'Reject account invitation',
    })
    .input(z.object({ invitationId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const res = await getAuth({
        useOriginalAccessControl: true,
      }).api.rejectInvitation({
        headers: authHeaders(context.headers),
        body: { invitationId: input.invitationId },
      })
      if (!res.invitation) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to reject invitation',
        })
      }
      return { invitation: formatInvitation(res.invitation) }
    }),

  leaveAccount: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/user/leave-account',
      tags: ['user'],
      summary: 'Leave the current account',
    })
    .handler(async ({ context }) => {
      const { headers: resHeaders, response: member } = await getAuth({
        useOriginalAccessControl: true,
      }).api.leaveOrganization({
        returnHeaders: true,
        headers: authHeaders(context.headers),
        body: { organizationId: context.auth.accountId },
      })

      forwardSetCookieHeader(context.resHeaders, resHeaders)

      await invalidateUserAccounts(member.userId)

      return { member }
    }),

  oauthApps: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/user/oauth-apps',
      tags: ['user'],
      summary: 'Get authorized OAuth apps for current user',
    })
    .handler(async ({ context }) => {
      const authorizedRows = await db
        .select({
          oauthApp: OAuthApp,
          accessCreatedAt: OAuthAccessToken.createdAt,
        })
        .from(OAuthAccessToken)
        .innerJoin(
          OAuthApp,
          or(
            eq(OAuthAccessToken.clientId, OAuthApp.clientId),
            eq(OAuthAccessToken.clientId, OAuthApp.publicClientId),
          ),
        )
        .where(eq(OAuthAccessToken.userId, context.auth.userId))
        .orderBy(desc(OAuthAccessToken.createdAt))

      const latestByOAuthAppId = new Map<
        string,
        { oauthApp: typeof OAuthApp.$inferSelect; accessCreatedAt: Date }
      >()
      for (const row of authorizedRows) {
        if (!latestByOAuthAppId.has(row.oauthApp.id)) {
          latestByOAuthAppId.set(row.oauthApp.id, row)
        }
      }
      const authorizedApps = [...latestByOAuthAppId.values()]

      const uniqueAccountIds = [
        ...new Set(authorizedApps.map(({ oauthApp }) => oauthApp.accountId)),
      ]

      const accounts =
        uniqueAccountIds.length > 0
          ? await db
              .select({
                account: Account,
                owner: User,
              })
              .from(Account)
              .innerJoin(Member, and(eq(Member.accountId, Account.id), eq(Member.role, 'owner')))
              .innerJoin(User, eq(User.id, Member.userId))
              .where(inArray(Account.id, uniqueAccountIds))
          : []

      const accountsMap = new Map(
        accounts.map(({ account, owner }) => [account.id, { account, owner }]),
      )

      return {
        apps: authorizedApps.map(({ oauthApp, accessCreatedAt }) => {
          const formatted = formatOAuthApp(oauthApp)
          const accountInfo = accountsMap.get(oauthApp.accountId)
          return {
            ...formatted,
            access: {
              createdAt: accessCreatedAt,
              updatedAt: formatted.updatedAt,
            },
            account: accountInfo
              ? {
                  id: accountInfo.account.id,
                  name: accountInfo.account.name,
                }
              : undefined,
            owner: accountInfo
              ? {
                  id: accountInfo.owner.id,
                  name: accountInfo.owner.name,
                }
              : undefined,
          }
        }),
      }
    }),

  revokeOauthApp: userProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/user/oauth-apps/{clientId}',
      tags: ['user'],
      summary: 'Revoke access token for a specific OAuth app',
    })
    .input(
      z.object({
        clientId: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const oauthApp = await getOAuthAppByClientId(input.clientId)
      if (!oauthApp) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }

      const clientIds = [oauthApp.clientId, oauthApp.publicClientId]

      await db.transaction(async (tx) => {
        await tx
          .delete(OAuthConsent)
          .where(
            and(
              eq(OAuthConsent.userId, context.auth.userId),
              inArray(OAuthConsent.clientId, clientIds),
            ),
          )

        await tx
          .delete(OAuthRefreshToken)
          .where(
            and(
              eq(OAuthRefreshToken.userId, context.auth.userId),
              inArray(OAuthRefreshToken.clientId, clientIds),
            ),
          )

        const tokens = await tx
          .delete(OAuthAccessToken)
          .where(
            and(
              eq(OAuthAccessToken.userId, context.auth.userId),
              inArray(OAuthAccessToken.clientId, clientIds),
            ),
          )
          .returning()

        await invalidateAccessTokensCache(...tokens.map((t) => t.token))
      })
    }),
}
