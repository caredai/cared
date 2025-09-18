import { adminProcedure } from '../../orpc'

export const mockRouter = {
  mock: adminProcedure
    .route({
      method: 'POST',
      path: '/v1/admin/mock',
      tags: ['admin'],
      summary: 'Mock endpoint for admin operations',
    })
    .handler(async () => {
      // TODO
    }),
}
