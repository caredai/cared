import { useMemo } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useTraces(input?: {
  userId?: string
  organizationId?: string
  workspaceId?: string
  appId?: string
  sessionId?: string
  fromTimestamp?: string
  toTimestamp?: string
  pageSize?: number
}) {
  const trpc = useTRPC()

  const { data, isLoading, isFetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      trpc.telemetry.listTraces.infiniteQueryOptions(
        {
          ...input,
          limit: input?.pageSize ?? 50,
        },
        {
          getNextPageParam: (lastPage) => {
            if (!lastPage.hasMore) return undefined
            return lastPage.cursor
          },
        },
      ),
    )

  const traces = useMemo(() => {
    return data?.pages.flatMap((page) => page.traces) ?? []
  }, [data])

  const total = data?.pages[0]?.total ?? 0

  return {
    traces,
    total,
    isLoading,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}
