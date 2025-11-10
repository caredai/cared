import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { authHeaders, generateRandomString, getAuth } from '@cared/auth'
import { asc, count, desc, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { App, OAuthAccessToken, OAuthApplication, OAuthConsent } from '@cared/db/schema'

import { protectedProcedure, publicProcedure } from '../orpc'
import { getAppById } from './app'

/**
 * Helper function to format OAuth application data for API responses
 * @param app - The OAuth application from database
 * @param includeSecret - Whether to include the full client secret (default: false)
 * @returns Formatted OAuth application object
 */
export function formatOAuthApp(app: OAuthApplication, includeSecret = false) {
  return {
    appId: app.appId!,
    clientId: app.clientId!,
    ...(includeSecret && { clientSecret: app.clientSecret! }),
    ...(!includeSecret && {
      clientSecretStart: app.clientSecret!.substring(0, 6),
    }),
    redirectUris: app.redirectURLs?.split(',').filter(Boolean) ?? [],
    disabled: app.disabled ?? false,
    metadata: app.metadata ? JSON.parse(app.metadata) : {},
    createdAt: app.createdAt!,
    updatedAt: app.updatedAt!,
  }
}

/**
 * OAuth Application Router - Handles all OAuth application related operations
 * Includes CRUD operations for OAuth apps, secret rotation, and public info endpoints
 */
export const oauthAppRouter = {
  /**
   * List OAuth applications of all apps in the account
   */
  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/oauth-apps',
      tags: ['oauth-apps'],
      summary: 'List OAuth apps for a specific app or all apps in account',
    })
    .input(z.object({}).default({}))
    .handler(async ({ context }) => {
      await context.auth.requirePermissions()

      const oauthApps = await db
        .select({
          oauthApp: OAuthApplication,
        })
        .from(App)
        .innerJoin(OAuthApplication, eq(OAuthApplication.appId, App.id))
        .where(eq(App.accountId, context.auth.accountId))
        .orderBy(asc(OAuthApplication.appId), desc(OAuthApplication.id))

      return {
        oauthApps: oauthApps.map(({ oauthApp }) => formatOAuthApp(oauthApp)),
      }
    }),

  /**
   * Check if an application has an OAuth app configured
   * Returns boolean indicating existence of OAuth configuration
   */
  has: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/oauth-apps/{appId}/exists',
      tags: ['oauth-apps'],
      summary: 'Check if the application has OAuth app',
    })
    .input(z.object({ appId: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      const app = await getAppById(context, input.appId)
      await context.auth.requirePermissions({ pseudo: [] }, { accountId: app.accountId })

      const oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.appId, input.appId),
      })

      return { exists: !!oauthApp }
    }),

  /**
   * Get OAuth application details by app ID
   * Returns full OAuth app configuration (excluding secret)
   */
  get: protectedProcedure
    .route({
      method: 'GET',
      path: '/v1/oauth-apps/{appId}',
      tags: ['oauth-apps'],
      summary: 'Get OAuth application',
    })
    .input(z.object({ appId: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      const app = await getAppById(context, input.appId)
      await context.auth.requirePermissions({ pseudo: [] }, { accountId: app.accountId })

      const oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.appId, input.appId),
      })
      if (!oauthApp) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }

      return {
        oauthApp: formatOAuthApp(oauthApp),
      }
    }),

  /**
   * Get public OAuth application information by client ID
   * Public endpoint that returns basic app info for OAuth discovery
   */
  info: publicProcedure
    .route({
      method: 'GET',
      path: '/v1/oauth-apps/client/{clientId}',
      tags: ['oauth-apps'],
      summary: 'Get OAuth application info by client ID',
    })
    .input(z.object({ clientId: z.string().min(32) }))
    .handler(async ({ input }) => {
      // Find OAuth application by clientId
      const _oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.clientId, input.clientId),
      })
      if (!_oauthApp) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }
      const oauthApp = formatOAuthApp(_oauthApp)

      const app = await db.query.App.findFirst({
        where: eq(App.id, oauthApp.appId),
      })
      if (!app) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Associated app not found',
        })
      }

      return {
        name: app.name,
        imageUrl: app.metadata.imageUrl,
        appId: app.id,
        clientId: oauthApp.clientId,
        redirectUris: oauthApp.redirectUris,
        disabled: oauthApp.disabled,
      }
    }),

  /**
   * Create a new OAuth application for an app
   * Registers OAuth app with auth service and updates app metadata
   * Returns OAuth app with full secret (only shown once)
   */
  create: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/oauth-apps',
      tags: ['oauth-apps'],
      summary: 'Create new OAuth app',
    })
    .input(
      z.object({
        appId: z.string().min(32),
        redirectUris: z
          .array(
            z.url().refine((uri) => uri.startsWith('http://') || uri.startsWith('https://'), {
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
    .handler(async ({ context, input }) => {
      const app = await getAppById(context, input.appId)
      await context.auth.requirePermissions({ app: ['write'] }, { accountId: app.accountId })

      const existingOauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.appId, input.appId),
      })
      if (existingOauthApp) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'OAuth app already exists',
        })
      }

      return await db.transaction(async (tx) => {
        const _oauthApp = await getAuth(tx).api.registerOAuthApplication({
          headers: authHeaders(context.headers),
          body: {
            redirect_uris: input.redirectUris ?? [],
            scope: 'profile email',
            metadata: {},
          },
        })

        const oauthApp = (
          await tx
            .update(OAuthApplication)
            .set({
              userId: null,
              appId: app.id,
            })
            .where(eq(OAuthApplication.clientId, _oauthApp.client_id))
            .returning()
        ).at(0)
        if (!oauthApp) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: 'Failed to create OAuth app',
          })
        }

        return {
          oauthApp: formatOAuthApp(oauthApp, true),
        }
      })
    }),

  /**
   * Update OAuth application configuration
   * Can update redirect URIs and disable/enable the app
   */
  update: protectedProcedure
    .route({
      method: 'PATCH',
      path: '/v1/oauth-apps/{appId}',
      tags: ['oauth-apps'],
      summary: 'Update OAuth application',
    })
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
    .handler(async ({ context, input }) => {
      const app = await getAppById(context, input.appId)
      await context.auth.requirePermissions({ app: ['write'] }, { accountId: app.accountId })

      const oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.appId, input.appId),
      })
      if (!oauthApp) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }

      const [updatedOauthApp] = await db
        .update(OAuthApplication)
        .set({
          redirectURLs: input.redirectUris?.join(','),
          disabled: input.disabled,
          updatedAt: new Date(),
        })
        .where(eq(OAuthApplication.clientId, oauthApp.clientId!))
        .returning()

      if (!updatedOauthApp) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to update OAuth app',
        })
      }

      return {
        oauthApp: formatOAuthApp(updatedOauthApp),
      }
    }),

  /**
   * Delete OAuth application and clean up related data
   * Removes OAuth app, access tokens, and consents
   */
  delete: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/v1/oauth-apps/{appId}',
      tags: ['oauth-apps'],
      summary: 'Delete OAuth application',
    })
    .input(z.object({ appId: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      const app = await getAppById(context, input.appId)
      await context.auth.requirePermissions({ app: ['write'] }, { accountId: app.accountId })

      const oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.appId, input.appId),
      })
      if (!oauthApp) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }

      // TODO: queue deletion
      const oauthAccessTokensNum = await db
        .select({
          count: count(),
        })
        .from(OAuthAccessToken)
        .where(eq(OAuthAccessToken.clientId, oauthApp.clientId!))
        .then((r) => r[0]!.count)
      if (oauthAccessTokensNum > 100) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Cannot delete oauth app since it has too many access tokens',
        })
      }

      await db.transaction(async (tx) => {
        // Delete related records
        await tx.delete(OAuthConsent).where(eq(OAuthConsent.clientId, oauthApp.clientId!))
        await tx.delete(OAuthAccessToken).where(eq(OAuthAccessToken.clientId, oauthApp.clientId!))
        await tx.delete(OAuthApplication).where(eq(OAuthApplication.clientId, oauthApp.clientId!))
      })
    }),

  /**
   * Rotate OAuth application client secret
   * Generates new secret and returns OAuth app with new secret
   */
  rotateSecret: protectedProcedure
    .route({
      method: 'POST',
      path: '/v1/oauth-apps/{appId}/rotate-secret',
      tags: ['oauth-apps'],
      summary: 'Rotate client secret for OAuth application',
    })
    .input(z.object({ appId: z.string().min(32) }))
    .handler(async ({ context, input }) => {
      const app = await getAppById(context, input.appId)
      await context.auth.requirePermissions({ app: ['write'] }, { accountId: app.accountId })

      const oauthApp = await db.query.OAuthApplication.findFirst({
        where: eq(OAuthApplication.appId, input.appId),
      })
      if (!oauthApp) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }

      // Generate new client secret
      const newClientSecret = generateRandomString(32, 'a-z', 'A-Z')

      // Update client secret of OAuth application
      const [updatedOauthApp] = await db
        .update(OAuthApplication)
        .set({
          clientSecret: newClientSecret,
          updatedAt: new Date(),
        })
        .where(eq(OAuthApplication.clientId, oauthApp.clientId!))
        .returning()

      if (!updatedOauthApp) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to rotate client secret',
        })
      }

      return {
        oauthApp: formatOAuthApp(updatedOauthApp, true),
      }
    }),
}
