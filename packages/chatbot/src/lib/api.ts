import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'

import type { API } from '@ownxai/sdk'
import { useTRPC as useSdkTRPC } from '@ownxai/sdk/react/client'

type UseTRPC = () => TRPCOptionsProxy<API>

let useTRPC_: UseTRPC = useSdkTRPC

export function setUseTRPC(useTRPC: UseTRPC) {
  useTRPC_ = useTRPC
}

export function useTRPC(): TRPCOptionsProxy<API> {
  return useTRPC_()
}
