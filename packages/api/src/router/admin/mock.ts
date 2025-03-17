import { mock } from '../../mock'
import { adminProcedure } from '../../trpc'

export const mockRouter = {
  mock: adminProcedure.mutation(async ({ ctx }) => {
    await mock(ctx.auth.userId)
  }),
}
