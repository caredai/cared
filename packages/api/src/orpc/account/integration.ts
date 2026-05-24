import { z } from 'zod/v4'

import { CloudflareIntegration, GithubIntegration } from '@cared/integration'

import { userProtectedProcedure } from '../../orpc'
import { integrationService } from '../../service/integration/integration'

export const integrationRouter = {
  /**
   * Get GitHub App installation URL for OAuth flow. Redirect user to returned url.
   */
  getGithubInstallationUrl: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/integrations/github/installation-url',
      tags: ['integration'],
      summary: 'Get GitHub installation URL',
    })
    .input(
      z
        .object({
          redirectUrl: z.string().url().optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const { url } = await GithubIntegration.instance().generateInstallationUrl(
        context.auth.accountId,
        input?.redirectUrl,
      )
      return { url }
    }),

  /**
   * Add a Cloudflare integration by API token. Validates token and stores encrypted.
   */
  addCloudflare: userProtectedProcedure
    .route({
      method: 'POST',
      path: '/integrations/cloudflare',
      tags: ['integration'],
      summary: 'Add Cloudflare integration',
    })
    .input(
      z.object({
        apiToken: z.string().min(1, 'API token is required'),
      }),
    )
    .handler(async ({ context, input }) => {
      await CloudflareIntegration.create(context.auth.accountId, {
        apiToken: input.apiToken,
      })
    }),

  /**
   * List all integrations for the current account.
   */
  list: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/integrations',
      tags: ['integration'],
      summary: 'List integrations',
    })
    .input(
      z
        .object({
          type: z.enum(['github', 'cloudflare']).optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      return integrationService.list(context.auth.accountId, { type: input?.type })
    }),

  /**
   * Get a single integration by ID.
   */
  get: userProtectedProcedure
    .route({
      method: 'GET',
      path: '/integrations/{id}',
      tags: ['integration'],
      summary: 'Get integration by ID',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const integration = await integrationService.get(context.auth.accountId, input.id)

      return {
        integration,
      }
    }),

  /**
   * Delete an integration by ID.
   */
  delete: userProtectedProcedure
    .route({
      method: 'DELETE',
      path: '/integrations/{id}',
      tags: ['integration'],
      summary: 'Delete integration by ID',
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await integrationService.delete(context.auth.accountId, input.id)
    }),
}
