import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'

import type { OwnxTrpcRouter } from '@ownxai/sdk'

type UseTRPC = () => TRPCOptionsProxy<OwnxTrpcRouter>

let useTRPC_: UseTRPC

export function setUseTRPC(useTRPC: UseTRPC) {
  useTRPC_ = useTRPC
}

export function useTRPC(): TRPCOptionsProxy<OwnxTrpcRouter> {
  return useTRPC_()
}
