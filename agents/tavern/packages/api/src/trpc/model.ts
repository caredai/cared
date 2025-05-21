import { userProtectedProcedure } from '../trpc'
import { createOwnxClient } from '../ownx'

export const modelRouter = {
  list: userProtectedProcedure
    .query(async ({ ctx,  }) => {
      const ownx = createOwnxClient(ctx)
      const ownxTrpc = ownx.trpc

      return await ownxTrpc.model.listProvidersModels.query()
    })
}
