import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useExpenses({
  organizationId,
  appId,
  pageSize = 50,
}: {
  organizationId?: string
  appId?: string
  pageSize?: number
}) {
  const trpc = useTRPC()

  const { data, isLoading, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      trpc.expense.list.infiniteQueryOptions(
        {
          organizationId,
          appId,
          limit: pageSize,
        },
        {
          getNextPageParam: (lastPage) => {
            if (!lastPage.hasMore) return undefined
            return lastPage.cursor
          },
          placeholderData: keepPreviousData,
        },
      ),
    )

  return {
    expensesPages: data?.pages,
    isLoadingExpenses: isLoading,
    refetchExpenses: refetch,
    isFetchingExpenses: isFetching,
    fetchNextExpensesPage: fetchNextPage,
    hasNextExpensesPage: hasNextPage,
    isFetchingNextExpensesPage: isFetchingNextPage,
  }
}
