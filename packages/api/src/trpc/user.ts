import { headers } from 'next/headers'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { auth } from '@ownxai/auth'
import { and, desc, eq, inArray } from '@ownxai/db'
import {
  Account,
  App,
  Membership,
  OAuthAccessToken,
  OAuthApplication,
  OAuthConsent,
  User,
  Workspace,
} from '@ownxai/db/schema'

import { publicProcedure, userProtectedProcedure } from '../trpc'
import { formatOAuthApp } from './oauth-app'

export const userRouter = {
  session: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/session',
        protect: true,
        tags: ['me'],
        summary: 'Get current session of current user',
      },
    })
    .query(async () => {
      return await auth.api.getSession({
        headers: await headers(),
      })
    }),

  me: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me',
        protect: true,
        tags: ['me'],
        summary: 'Get current user information',
      },
    })
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This api is only available for authenticated users',
        })
      }

      const { user } = (await auth.api.getSession({
        headers: await headers(),
      }))!

      return {
        user,
      }
    }),

  accounts: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/accounts',
        protect: true,
        tags: ['me'],
        summary: 'Get linked accounts of current user',
      },
    })
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This api is only available for authenticated users',
        })
      }

      const accounts = await ctx.db.query.Account.findMany({
        where: eq(Account.userId, ctx.auth.userId),
      })

      return { accounts }
    }),

  sessions: userProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/sessions',
        protect: true,
        tags: ['me'],
        summary: 'Get sessions of current user',
      },
    })
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This api is only available for authenticated users',
        })
      }

      const sessions = (await auth.api.customListSessions({
        headers: await headers(),
      })) as (typeof auth.$Infer.Session)['session'][]

      return {
        sessions: sessions.map((session) => ({
          ...session,
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
    .meta({
      openapi: {
        method: 'GET',
        path: '/v1/me/oauth-apps',
        protect: true,
        tags: ['me'],
        summary: 'Get authorized OAuth apps for current user',
      },
    })
    .query(async ({ ctx }) => {
      const sqlClientIds = ctx.db
        .selectDistinct({
          clientId: OAuthAccessToken.clientId,
          createdAt: OAuthAccessToken.createdAt,
          updatedAt: OAuthAccessToken.updatedAt,
        })
        .from(OAuthAccessToken)
        .where(eq(OAuthAccessToken.userId, ctx.auth.userId))
        .orderBy(desc(OAuthAccessToken.updatedAt), desc(OAuthAccessToken.createdAt))
        .as('sqlClientIds')

      const oauthApps = (
        await ctx.db
          .select({
            oauthApp: OAuthApplication,
            createdAt: sqlClientIds.createdAt,
            updatedAt: sqlClientIds.updatedAt,
          })
          .from(sqlClientIds)
          .innerJoin(OAuthApplication, eq(OAuthApplication.clientId, sqlClientIds.clientId))
      ).map((a) => formatOAuthApp(a.oauthApp))

      const apps = await ctx.db
        .select({
          app: App,
          workspace: Workspace,
          owner: User,
        })
        .from(App)
        .innerJoin(Workspace, eq(Workspace.id, App.workspaceId))
        .innerJoin(Membership, eq(Membership.workspaceId, Workspace.id))
        .innerJoin(User, eq(User.id, Membership.userId))
        .where(
          and(
            inArray(
              App.id,
              oauthApps.map((a) => a.metadata.appId),
            ),
            eq(Membership.role, 'owner'),
          ),
        )

      return {
        apps: apps.map(({ app, workspace, owner }) => ({
          clientId: app.metadata.clientId!,
          access: {
            createdAt: oauthApps.find((a) => a.metadata.appId === app.id)?.createdAt,
            updatedAt: oauthApps.find((a) => a.metadata.appId === app.id)?.updatedAt,
          },
          appId: app.id,
          name: app.name,
          imageUrl: app.metadata.imageUrl,
          workspace: {
            id: workspace.id,
            name: workspace.name,
          },
          owner: {
            id: owner.id,
            name: owner.name,
          },
        })),
      }
    }),

  revokeOauthApp: userProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/v1/me/oauth-apps/{clientId}',
        protect: true,
        tags: ['me'],
        summary: 'Revoke access token for a specific OAuth app',
      },
    })
    .input(
      z.object({
        clientId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(OAuthConsent)
          .where(
            and(
              eq(OAuthConsent.userId, ctx.auth.userId),
              eq(OAuthConsent.clientId, input.clientId),
            ),
          )

        await tx
          .delete(OAuthAccessToken)
          .where(
            and(
              eq(OAuthAccessToken.userId, ctx.auth.userId),
              eq(OAuthAccessToken.clientId, input.clientId),
            ),
          )
      })
    }),
}
