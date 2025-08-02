import { headers } from 'next/headers'
import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'

import { auth, generateRandomString } from '@cared/auth'
import { desc, eq } from '@cared/db'
import { App, OAuthAccessToken, OAuthApplication, OAuthConsent } from '@cared/db/schema'

import { publicProcedure, userProtectedProcedure } from '../trpc'
import { getAppById } from './app'
import { verifyWorkspaceOwner } from './workspace'

// Helper function: Format OAuth application
export function formatOAuthApp(app: OAuthApplication, includeSecret = false) {
  return {
    clientId: app.clientId,
    ...(includeSecret && { clientSecret: app.clientSecret }),
    ...(!includeSecret && {
      clientSecretStart: app.clientSecret!.substring(0, 6),
    }),
    redirectUris: app.redirectURLs?.split(',').filter(Boolean) ?? [],
    disabled: app.disabled,
    metadata: app.metadata ? JSON.parse(app.metadata) : {},
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  }
}

export const oauthAppRouter = {
  // List all OAuth apps in a workspace or for a specific app
  list: userProtectedProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/oauth-apps' } })
    .input(
      z
        .object({
          workspaceId: z.string().min(32).optional(),
          appId: z.string().min(32).optional(),
        })
        .refine((data) => data.workspaceId || data.appId, {
          message: 'Either workspaceId or appId must be provided',
        }),
    )
    .query(async ({ ctx, input }) => {
      // If appId is provided, verify app ownership
      if (input.appId) {
        const app = await getAppById(ctx, input.appId)
        await verifyWorkspaceOwner(ctx, app.workspaceId)

        const clientId = app.metadata.clientId
        if (!clientId) {
          return { oauthApps: [] }
        }

        const oauthApp = await ctx.db.query.OAuthApplication.findFirst({
          where: eq(OAuthApplication.clientId, clientId),
        })

        if (!oauthApp) {
          return { oauthApps: [] }
        }

        return {
          oauthApps: [
            {
              appId: app.id,
              oauthApp: formatOAuthApp(oauthApp),
            },
          ],
        }
      }

      // If workspaceId is provided, verify workspace ownership and list all OAuth apps
      if (input.workspaceId) {
        await verifyWorkspaceOwner(ctx, input.workspaceId)

        // Get all apps in the workspace
        const apps = await ctx.db.query.App.findMany({
          where: eq(App.workspaceId, input.workspaceId),
          orderBy: desc(App.createdAt),
        })

        // Get OAuth apps for each app
        const oauthApps = await Promise.all(
          apps.map(async (app) => {
            const clientId = app.metadata.clientId
            if (!clientId) return null

            const oauthApp = await ctx.db.query.OAuthApplication.findFirst({
              where: eq(OAuthApplication.clientId, clientId),
            })

            if (!oauthApp) return null

            return {
              appId: app.id,
              oauthApp: formatOAuthApp(oauthApp),
            }
          }),
        )

        // Filter out null values
        const validOauthApps = oauthApps.filter((item): item is NonNullable<typeof item> => !!item)

        return {
          oauthApps: validOauthApps,
        }
      }

      // This case should never happen due to the input validation
      return { oauthApps: [] }
    }),

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

  info: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/oauth-apps/client/{clientId}' } })
    .input(z.object({ clientId: z.string().min(32) }))
    .query(async ({ ctx, input }) => {
      // Find OAuth application by clientId
      const _oauthApp = await ctx.db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, input.clientId),
      })
      if (!_oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }
      const oauthApp = formatOAuthApp(_oauthApp)

      const app = await ctx.db.query.App.findFirst({
        where: eq(App.id, oauthApp.metadata.appId),
      })
      if (!app) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Associated app not found',
        })
      }

      return {
        name: app.name,
        imageUrl: app.metadata.imageUrl,
        clientId: oauthApp.clientId,
        redirectUris: oauthApp.redirectUris,
        disabled: oauthApp.disabled,
      }
    }),

  // Create new OAuth app
  create: userProtectedProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/oauth-apps' } })
    .input(
      z.object({
        appId: z.string().min(32),
        redirectUris: z
          .array(
            z
              .string()
              .url()
              .refine((uri) => uri.startsWith('http://') || uri.startsWith('https://'), {
                message: 'Redirect URI must start with http:// or https://',
              }),
          )
          .refine((uris) => new Set(uris).size === uris.length, {
            message: 'Redirect URIs must be unique',
          })
          .optional(),
        // scopes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getAppById(ctx, input.appId)
      await verifyWorkspaceOwner(ctx, app.workspaceId)

      const _oauthApp = await auth.api.registerOAuthApplication({
        headers: await headers(),
        body: {
          redirect_uris: input.redirectUris?.map((u) => u.trim()) ?? [],
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
          oauthApp: formatOAuthApp(oauthApp, true),
        }
      })
    }),

  // Update OAuth application
  update: userProtectedProcedure
    .meta({ openapi: { method: 'PATCH', path: '/v1/oauth-apps/{appId}' } })
    .input(
      z.object({
        appId: z.string().min(32),
        redirectUris: z
          .array(
            z
              .string()
              .url()
              .refine((uri) => uri.startsWith('http://') || uri.startsWith('https://'), {
                message: 'Redirect URI must start with http:// or https://',
              }),
          )
          .refine((uris) => new Set(uris).size === uris.length, {
            message: 'Redirect URIs must be unique',
          })
          .optional(),
        disabled: z.boolean().optional(),
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
          redirectURLs: input.redirectUris?.map((u) => u.trim()).join(','),
          disabled: input.disabled,
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
        oauthApp: formatOAuthApp(updatedOauthApp, true),
      }
    }),
}
