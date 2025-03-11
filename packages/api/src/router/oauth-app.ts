import type { OAuthApplication } from '@clerk/backend'
import { clerkClient } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { eq } from '@mindworld/db'
import { OAuthApp } from '@mindworld/db/schema'

import { getClerkOAuthApp } from '../auth'
import { userProtectedProcedure } from '../trpc'
import { getAppById } from './app'
import { verifyWorkspaceOwner } from './workspace'

function filteredOauthApp(oauthApp: OAuthApp, clerkOAuthApp: OAuthApplication) {
  return {
    ...oauthApp,
    redirectUris: clerkOAuthApp.redirectUris,
    clientId: clerkOAuthApp.clientId,
    ...(clerkOAuthApp.clientSecret ? { clientSecret: clerkOAuthApp.clientSecret } : {}),
    discoveryUrl: clerkOAuthApp.discoveryUrl,
  }
}

export const oauthAppRouter = {
  // Check if app has OAuth app
  has: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/oauth-apps/{appId}/exists' } })
    .input(z.object({ appId: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const oauthApp = await ctx.db.query.OAuthApp.findFirst({
        where: eq(OAuthApp.appId, input.appId),
      })

      return {
        exists: !!oauthApp && !!(await getClerkOAuthApp(oauthApp.oauthAppId)),
      }
    }),

  // Get OAuth app
  get: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/oauth-apps/{appId}' } })
    .input(z.object({ appId: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const oauthApp = await ctx.db.query.OAuthApp.findFirst({
        where: eq(OAuthApp.appId, input.appId),
      })

      if (!oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      const clerkOAuthApp = await getClerkOAuthApp(oauthApp.oauthAppId)
      if (!clerkOAuthApp) {
        // Delete the OAuth app record from our database since it no longer exists in Clerk
        await ctx.db.delete(OAuthApp).where(eq(OAuthApp.appId, input.appId))

        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      return {
        oauthApp: filteredOauthApp(oauthApp, clerkOAuthApp),
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

      // Create OAuth app in Clerk
      const client = await clerkClient()
      const clerkOAuthApp = await client.oauthApplications.createOAuthApplication({
        name: input.appId,
        redirect_uris: input.redirectUris,
        public: false, // always private
        scopes: 'profile email',
      })

      try {
        // Store the mapping in our database
        const [oauthApp] = await ctx.db
          .insert(OAuthApp)
          .values({
            appId: input.appId,
            oauthAppId: clerkOAuthApp.id,
            clientId: clerkOAuthApp.clientId,
          })
          .returning()

        return {
          oauthApp: filteredOauthApp(oauthApp!, clerkOAuthApp),
        }
      } catch {
        // Delete the OAuth app from Clerk if we failed to store the record in our database
        await client.oauthApplications.deleteOAuthApplication(clerkOAuthApp.id)

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create OAuth app',
        })
      }
    }),

  // Update OAuth app
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

      const oauthApp = await ctx.db.query.OAuthApp.findFirst({
        where: eq(OAuthApp.appId, input.appId),
      })

      if (!oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      // Update OAuth app in Clerk
      const client = await clerkClient()
      const clerkOAuthApp = await client.oauthApplications.updateOAuthApplication(
        oauthApp.oauthAppId,
        {
          redirect_uris: input.redirectUris,
          // scopes: input.scopes,
        },
      )

      return {
        oauthApp: filteredOauthApp(oauthApp, clerkOAuthApp),
      }
    }),

  // Delete OAuth app
  delete: userProtectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/v1/oauth-apps/{appId}' } })
    .input(z.object({ appId: z.string().min(32) }))
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const oauthApp = await ctx.db.query.OAuthApp.findFirst({
        where: eq(OAuthApp.appId, input.appId),
      })

      if (!oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      await ctx.db.transaction(async (tx) => {
        // Delete from our database first
        await tx.delete(OAuthApp).where(eq(OAuthApp.appId, input.appId))

        // Then delete from Clerk
        const client = await clerkClient()
        await client.oauthApplications.deleteOAuthApplication(oauthApp.oauthAppId)
      })
    }),

  // Rotate client secret
  rotateSecret: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/oauth-apps/{appId}/rotate-secret' } })
    .input(z.object({ appId: z.string().min(32) }))
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const oauthApp = await ctx.db.query.OAuthApp.findFirst({
        where: eq(OAuthApp.appId, input.appId),
      })

      if (!oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      // Rotate client secret in Clerk
      const client = await clerkClient()
      const clerkOAuthApp = await client.oauthApplications.rotateOAuthApplicationSecret(
        oauthApp.oauthAppId,
      )

      return {
        oauthApp: filteredOauthApp(oauthApp, clerkOAuthApp),
      }
    }),
}
