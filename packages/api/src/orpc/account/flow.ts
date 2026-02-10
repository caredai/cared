import { z } from 'zod/v4'

import { protectedProcedure } from '../../orpc'
import { langflowService } from '../../service/langflow/langflow'
import { getAppById } from './app'

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
        appId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const app = await getAppById(context, input.appId)
      await context.auth.requirePermissions({ pseudo: [] }, { accountId: app.accountId })

      await langflowService.ensureProject(app.accountId, input.appId, app.name)
    }),
}
