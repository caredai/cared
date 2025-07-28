import { createCaredClient } from '../cared'
import { userProtectedProcedure } from '../trpc'

export const modelRouter = {
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const cared = createCaredClient(ctx)
    const caredTrpc = cared.trpc

    return await caredTrpc.model.listProvidersModels.query()
  }),
}
