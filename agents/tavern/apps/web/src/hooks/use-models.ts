import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useModels() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.model.list.queryOptions(),
    // staleTime: Infinity,
    // gcTime: Infinity,
  })

  return {
    models: data.models,
    refetchModels: refetch,
  }
}
