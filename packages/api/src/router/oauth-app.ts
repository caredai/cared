import { headers } from 'next/headers'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { auth, generateRandomString } from '@mindworld/auth'
import { eq } from '@mindworld/db'
import { App, OAuthAccessToken, OAuthApplication, OAuthConsent } from '@mindworld/db/schema'

import { userProtectedProcedure } from '../trpc'
import { getAppById } from './app'
import { verifyWorkspaceOwner } from './workspace'

// Helper function: Format OAuth application
function formatOAuthApp(app: OAuthApplication) {
  return {
    clientId: app.clientId,
    clientSecret: app.clientSecret,
    redirectUris: app.redirectURLs?.split(',') ?? [],
    metadata: app.metadata ? JSON.parse(app.metadata) : {},
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  }
}

export const oauthAppRouter = {
  // Check if the application has OAuth app
  has: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/oauth-apps/{appId}/exists' } })
    .input(z.object({ appId: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Check if clientId exists in application metadata
      const clientId = app.metadata.clientId

      if (!clientId) {
        return { exists: false }
      }

      const oauthApp = await ctx.db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, clientId),
      })

      return { exists: !!oauthApp }
    }),

  // Get OAuth application
  get: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/oauth-apps/{appId}' } })
    .input(z.object({ appId: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Get clientId from application metadata
      const clientId = app.metadata.clientId
      if (!clientId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      const oauthApp = await ctx.db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, clientId),
      })
      if (!oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      return {
        oauthApp: formatOAuthApp(oauthApp),
      }
    }),

  // Create new OAuth app
  create: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/oauth-apps' } })
    .input(
      z.object({
        appId: z.string().min(32),
        redirectUris: z.array(z.string()).optional(),
        // scopes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const _oauthApp = await auth.api.registerOAuthApplication({
        headers: await headers(),
        body: {
          name: input.appId,
          redirect_uris: input.redirectUris ?? [],
          scope: 'profile email',
          metadata: { appId: input.appId },
        },
      })

      return await ctx.db.transaction(async (tx) => {
        await tx
          .update(App)
          .set({
            metadata: {
              ...app.metadata,
              clientId: _oauthApp.client_id,
            },
          })
          .where(eq(App.id, app.id))
          .returning()

        const oauthApp = await tx.query.OAuthApplication.findFirst({
          where: eq(OAuthApplication.clientId, _oauthApp.client_id),
        })
        if (!oauthApp) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create OAuth app',
          })
        }

        return {
          oauthApp: formatOAuthApp(oauthApp),
        }
      })
    }),

  // Update OAuth application
  update: userProtectedProcedure
    .meta({ openapi: { method: 'PATCH', path: '/v1/oauth-apps/{appId}' } })
    .input(
      z.object({
        appId: z.string().min(32),
        redirectUris: z.array(z.string()).optional(),
        // scopes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Get clientId from application metadata
      const clientId = app.metadata.clientId
      if (!clientId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      const oauthApp = await ctx.db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, clientId),
      })
      if (!oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      const [updatedOauthApp] = await ctx.db
        .update(OAuthApplication)
        .set({
          redirectURLs: input.redirectUris?.join(','),
          updatedAt: new Date(),
        })
        .where(eq(OAuthApplication.clientId, clientId))
        .returning()

      if (!updatedOauthApp) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update OAuth app',
        })
      }

      return {
        oauthApp: formatOAuthApp(updatedOauthApp),
      }
    }),

  // Delete OAuth application
  delete: userProtectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/v1/oauth-apps/{appId}' } })
    .input(z.object({ appId: z.string().min(32) }))
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Get clientId from application metadata
      const clientId = app.metadata.clientId
      if (!clientId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      await ctx.db.transaction(async (tx) => {
        // Delete related records
        await tx.delete(OAuthConsent).where(eq(OAuthConsent.clientId, clientId))
        await tx.delete(OAuthAccessToken).where(eq(OAuthAccessToken.clientId, clientId))
        await tx.delete(OAuthApplication).where(eq(OAuthApplication.clientId, clientId))

        // Update application metadata, remove clientId
        const { clientId: _, ...restMetadata } = app.metadata
        await tx
          .update(App)
          .set({
            metadata: restMetadata,
          })
          .where(eq(App.id, app.id))
      })
    }),

  // Rotate client secret
  rotateSecret: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/oauth-apps/{appId}/rotate-secret' } })
    .input(z.object({ appId: z.string().min(32) }))
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      // Get clientId from application metadata
      const clientId = app.metadata.clientId

      if (!clientId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      const oauthApp = await ctx.db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, clientId),
      })

      if (!oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      // Generate new client secret
      const newClientSecret = generateRandomString(32, 'a-z', 'A-Z')

      // Update client secret of OAuth application
      const [updatedOauthApp] = await ctx.db
        .update(OAuthApplication)
        .set({
          clientSecret: newClientSecret,
          updatedAt: new Date(),
        })
        .where(eq(OAuthApplication.clientId, clientId))
        .returning()

      if (!updatedOauthApp) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to rotate client secret',
        })
      }

      return {
        oauthApp: formatOAuthApp(updatedOauthApp),
      }
    }),
}
