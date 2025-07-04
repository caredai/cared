import { createOwnxClient } from '../ownx'
import { userProtectedProcedure } from '../trpc'

export const modelRouter = {
  list: userProtectedProcedure.query(async ({ ctx }) => {
    const ownx = createOwnxClient(ctx)
    const ownxTrpc = ownx.trpc

    return await ownxTrpc.model.listProvidersModels.query()
  }),
}
