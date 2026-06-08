import { ORPCError } from '@orpc/server'
import { z } from 'zod/v4'

import { authHeaders, getAuth, OAUTH_APP_SCOPES, oauthProviderScopesSchema } from '@cared/auth'
import { and, count, desc, eq, inArray } from '@cared/db'
import { db } from '@cared/db/client'
import {
  OAuthAccessToken,
  OAuthApp,
  OAuthClient,
  OAuthConsent,
  OAuthRefreshToken,
} from '@cared/db/schema'

import { clientSecretHintsFrom, getOAuthAppByClientId, getOAuthAppById } from '../../operation'
import { protectedProcedure, publicProcedure, userPlainProtectedProcedure } from '../../orpc'
import { formatOAuthApp } from '../../types'
import { deleteImage } from '../utils'

const PUBLIC_GRANT_TYPES = ['authorization_code', 'refresh_token'] as const
const CONFIDENTIAL_GRANT_TYPES = [
  'authorization_code',
  'refresh_token',
  'client_credentials',
] as const

const redirectUrisSchema = z
  .array(
    z.url().refine((uri) => uri.startsWith('http://') || uri.startsWith('https://'), {
      message: 'Redirect URI must start with http:// or https://',
    }),
  )
  .refine((uris) => new Set(uris).size === uris.length, {
    message: 'Redirect URIs must be unique',
  })

function clientIdsForApp(app: OAuthApp) {
  return [app.clientId, app.publicClientId]
}

/**
 * OAuth App Router - Handles all OAuth app related operations
 * Includes CRUD operations for OAuth apps, secret rotation, and public info endpoints
 */
export const oauthAppRouter = {
  /**
   * List OAuth app scopes available when creating or configuring clients
   */
  listScopes: protectedProcedure
    .route({
      method: 'GET',
      path: '/oauth-apps/scopes',
      tags: ['oauth-apps'],
      summary: 'List OAuth app scopes',
    })
    .handler(() => {
      return {
        scopes: OAUTH_APP_SCOPES.map(({ id, name }) => ({ id, name })),
      }
    }),

  /**
   * List OAuth apps in the current account
   */
  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/oauth-apps',
      tags: ['oauth-apps'],
      summary: 'List OAuth apps in the current account',
    })
    .input(z.object({}).default({}))
    .handler(async ({ context }) => {
      await context.auth.requirePermissions({
        oauthApp: ['read'],
      })

      const oauthApps = await db.query.OAuthApp.findMany({
        where: eq(OAuthApp.accountId, context.auth.accountId),
        orderBy: [desc(OAuthApp.id)],
      })

      return {
        oauthApps: oauthApps.map((app) => formatOAuthApp(app)),
      }
    }),

  /**
   * Check if an OAuth app exists in the current account
   */
  has: protectedProcedure
    .route({
      method: 'GET',
      path: '/oauth-apps/{id}/exists',
      tags: ['oauth-apps'],
      summary: 'Check if the OAuth app exists',
    })
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({
        oauthApp: ['read'],
      })

      const app = await db.query.OAuthApp.findFirst({
        where: and(eq(OAuthApp.id, input.id), eq(OAuthApp.accountId, context.auth.accountId)),
      })

      return {
        exists: !!app,
      }
    }),

  /**
   * Get OAuth app details by id
   */
  get: protectedProcedure
    .route({
      method: 'GET',
      path: '/oauth-apps/{id}',
      tags: ['oauth-apps'],
      summary: 'Get OAuth app',
    })
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({
        oauthApp: ['read'],
      })

      const app = await db.query.OAuthApp.findFirst({
        where: and(eq(OAuthApp.id, input.id), eq(OAuthApp.accountId, context.auth.accountId)),
      })
      if (!app) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }

      return {
        oauthApp: formatOAuthApp(app),
      }
    }),

  /**
   * Get public OAuth app information by client ID (confidential or public)
   */
  info: publicProcedure
    .route({
      method: 'GET',
      path: '/oauth-apps/client/{clientId}',
      tags: ['oauth-apps'],
      summary: 'Get OAuth app info by client ID',
    })
    .input(z.object({ clientId: z.string().min(32) }))
    .handler(async ({ input }) => {
      const app = await getOAuthAppByClientId(input.clientId)
      if (!app) {
        throw new ORPCError('NOT_FOUND', {
          message: 'App not found',
        })
      }
      const formatted = formatOAuthApp(app)

      return {
        id: formatted.id,
        clientId: input.clientId,
        redirectUris: formatted.redirectUris,
        name: formatted.name,
        description: formatted.description,
        homeUrl: formatted.homeUrl,
        logo: formatted.logo,
      }
    }),

  /**
   * Create a new OAuth app (confidential + public clients) in the current account
   */
  create: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/oauth-apps',
      tags: ['oauth-apps'],
      summary: 'Create new OAuth app',
    })
    .input(
      z.object({
        redirectUris: redirectUrisSchema,
        name: z.string().min(1).max(64),
        description: z.string().min(1).max(256).optional(),
        homeUrl: z.url().optional(),
        logo: z.url().optional(),
        scopes: oauthProviderScopesSchema.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ oauthApp: ['write'] })

      const accountId = context.auth.accountId
      const scope = input.scopes?.join(' ')

      return await db.transaction(async (tx) => {
        const auth = getAuth({ tx })

        const [confidentialCreated, publicCreated] = await Promise.all([
          auth.api.createOAuthClient({
            headers: authHeaders(context.headers),
            body: {
              redirect_uris: input.redirectUris,
              scope,
              grant_types: [...CONFIDENTIAL_GRANT_TYPES],
            },
          }),
          auth.api.createOAuthClient({
            headers: authHeaders(context.headers),
            body: {
              redirect_uris: input.redirectUris,
              scope,
              token_endpoint_auth_method: 'none',
              grant_types: [...PUBLIC_GRANT_TYPES],
            },
          }),
        ])

        const plainSecret = confidentialCreated.client_secret!
        const { start, end } = clientSecretHintsFrom(plainSecret)

        const oauthApp = (
          await tx
            .insert(OAuthApp)
            .values({
              accountId,
              clientId: confidentialCreated.client_id,
              publicClientId: publicCreated.client_id,
              clientSecretStart: start,
              clientSecretEnd: end,
              redirectUris: input.redirectUris,
              scopes: input.scopes,
              name: input.name,
              description: input.description,
              homeUrl: input.homeUrl,
              logo: input.logo,
            })
            .returning()
        ).at(0)

        if (!oauthApp) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: 'Failed to create oauth app',
          })
        }

        return {
          oauthApp: formatOAuthApp(oauthApp, { clientSecret: plainSecret }),
        }
      })
    }),

  /**
   * Update OAuth app configuration
   */
  update: userPlainProtectedProcedure
    .route({
      method: 'PATCH',
      path: '/oauth-apps/{id}',
      tags: ['oauth-apps'],
      summary: 'Update OAuth app',
    })
    .input(
      z.object({
        id: z.string().min(1),
        redirectUris: redirectUrisSchema.optional(),
        name: z.string().min(1).max(64).optional(),
        description: z.string().min(1).max(256).nullish(),
        homeUrl: z.url().nullish(),
        logo: z.url().nullish(),
        scopes: oauthProviderScopesSchema.nullish(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.auth.requirePermissions({ oauthApp: ['write'] })

      const existing = await db.query.OAuthApp.findFirst({
        where: and(eq(OAuthApp.id, input.id), eq(OAuthApp.accountId, context.auth.accountId)),
      })
      if (!existing) {
        throw new ORPCError('NOT_FOUND', {
          message: 'OAuth app not found',
        })
      }

      return await db.transaction(async (tx) => {
        const clientUpdates: Partial<typeof OAuthClient.$inferInsert> = {}
        if (input.redirectUris) {
          clientUpdates.redirectUris = input.redirectUris
        }
        if (input.scopes !== undefined) {
          clientUpdates.scopes = input.scopes
        }
        if (Object.keys(clientUpdates).length > 0) {
          await tx
            .update(OAuthClient)
            .set(clientUpdates)
            .where(inArray(OAuthClient.clientId, clientIdsForApp(existing)))
        }

        const updatedApp = (
          await tx
            .update(OAuthApp)
            .set({
              redirectUris: input.redirectUris,
              scopes: input.scopes,
              name: input.name,
              description: input.description,
              homeUrl: input.homeUrl,
              logo: input.logo,
            })
            .where(eq(OAuthApp.id, input.id))
            .returning()
        ).at(0)

        if (!updatedApp) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: 'Failed to update oauth app',
          })
        }

        if (existing.logo && existing.logo !== updatedApp.logo) {
          await deleteImage(existing.logo)
        }

        return {
          oauthApp: formatOAuthApp(updatedApp),
        }
      })
    }),

  /**
   * Delete OAuth app and clean up related data
   */
  delete: userPlainProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/oauth-apps/{id}',
      tags: ['oauth-apps'],
      summary: 'Delete OAuth app',
    })
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const app = await getOAuthAppById(input.id)
      await context.auth.requirePermissions({ oauthApp: ['write'] }, { accountId: app.accountId })

      const clientIds = clientIdsForApp(app)

      // TODO
      const oauthAccessTokensNum = await db
        .select({
          count: count(),
        })
        .from(OAuthAccessToken)
        .where(inArray(OAuthAccessToken.clientId, clientIds))
        .then((r) => r[0]!.count)
      if (oauthAccessTokensNum > 100) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Cannot delete oauth app since it has issued too many access tokens',
        })
      }

      await db.transaction(async (tx) => {
        await tx.delete(OAuthConsent).where(inArray(OAuthConsent.clientId, clientIds))
        await tx.delete(OAuthAccessToken).where(inArray(OAuthAccessToken.clientId, clientIds))
        await tx.delete(OAuthRefreshToken).where(inArray(OAuthRefreshToken.clientId, clientIds))
        await tx.delete(OAuthClient).where(inArray(OAuthClient.clientId, clientIds))
        await tx.delete(OAuthApp).where(eq(OAuthApp.id, input.id))
      })
    }),

  /**
   * Rotate OAuth app client secret (confidential client only)
   */
  rotateSecret: userPlainProtectedProcedure
    .route({
      method: 'POST',
      path: '/oauth-apps/{id}/rotate-secret',
      tags: ['oauth-apps'],
      summary: 'Rotate client secret for OAuth app',
    })
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const app = await getOAuthAppById(input.id)
      await context.auth.requirePermissions({ oauthApp: ['write'] }, { accountId: app.accountId })

      return await db.transaction(async (tx) => {
        const rotated = await getAuth({ tx }).api.rotateClientSecret({
          headers: authHeaders(context.headers),
          body: {
            client_id: app.clientId,
          },
        })

        const plainSecret = rotated.client_secret!
        const { start, end } = clientSecretHintsFrom(plainSecret)

        const updatedApp = (
          await tx
            .update(OAuthApp)
            .set({
              clientSecretStart: start,
              clientSecretEnd: end,
            })
            .where(eq(OAuthApp.id, input.id))
            .returning()
        ).at(0)
        if (!updatedApp) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: 'Failed to rotate client secret',
          })
        }

        return {
          oauthApp: formatOAuthApp(updatedApp, { clientSecret: plainSecret }),
        }
      })
    }),
}
