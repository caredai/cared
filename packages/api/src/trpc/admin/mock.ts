import { adminProcedure } from '../../trpc'

export const mockRouter = {
  mock: adminProcedure.mutation(async () => {
    // TODO
  }),
}
