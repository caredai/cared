import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import { langflowService } from '../../service/langflow/langflow'
import { getOAuthAppById } from '../../operation/oauth-app'

export const flowRouter = {
  enable: protectedProcedure
    .route({
      method: 'POST',
      path: '/flow/enable',
      tags: ['flow'],
      summary: 'Enable Langflow for an app',
    })
    .input(
      z.object({
        oauthAppId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const app = await getOAuthAppById(input.oauthAppId)
      await context.auth.requirePermissions({ pseudo: [] }, { accountId: app.accountId })

      await langflowService.ensureProject(app.accountId, input.oauthAppId, app.name)
    }),
}
