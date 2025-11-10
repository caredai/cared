import { useCallback, useEffect } from 'react'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { atom, useAtom } from 'jotai'
import { toast } from 'sonner'

import { orpc } from '@/lib/orpc'

const PAGE_SIZE = 100

export function useCredits() {
  const {
    data: { credits },
    refetch: refetchCredits,
  } = useSuspenseQuery(orpc.credits.getCredits.queryOptions())
  return {
    credits,
    refetchCredits,
  }
}

const hasAttemptedFetchAtom = atom(false)

export function useListCreditsOrders() {
  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    orpc.credits.listOrders.infiniteOptions({
      input: (cursor?: string) => ({
        // statuses: ['open', 'complete', 'draft', 'paid'],
        cursor,
        limit: PAGE_SIZE,
      }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => {
        if (!lastPage.hasMore) return undefined
        return lastPage.cursor
      },
      placeholderData: keepPreviousData,
    }),
  )

  const [hasAttemptedFetch, setHasAttemptedFetch] = useAtom(hasAttemptedFetchAtom)

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !hasAttemptedFetch) {
      console.log('Fetching credits orders...')
      setHasAttemptedFetch(true)
      void fetchNextPage().finally(() => setHasAttemptedFetch(false))
    }
  }, [fetchNextPage, hasAttemptedFetch, hasNextPage, isFetchingNextPage, setHasAttemptedFetch])

  return {
    creditsOrdersPages: data?.pages,
    refetchCreditsOrders: refetch,
  }
}

export function useCreateCreditsOnetimeCheckout() {
  const { refetchCredits } = useCredits()
  const { refetchCreditsOrders } = useListCreditsOrders()

  const createMutation = useMutation(
    orpc.credits.createOnetimeCheckout.mutationOptions({
      onSuccess: () => {
        void refetchCredits()
        void refetchCreditsOrders()
      },
    }),
  )

  return useCallback(
    async (credits: number) => {
      return await createMutation.mutateAsync({
        credits,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useListCreditsSubscriptions() {
  const { data, refetch } = useQuery({
    ...orpc.credits.listSubscriptions.queryOptions(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    creditsSubscriptions: data?.subscriptions,
    refetchCreditsSubscriptions: refetch,
  }
}

export function useUpdateAutoRechargeCreditsSettings() {
  const { refetchCredits } = useCredits()

  const updateMutation = useMutation(
    orpc.credits.updateAutoRechargeSettings.mutationOptions({
      onSuccess: () => {
        void refetchCredits()
      },
      onError: (error) => {
        toast.error(`Failed to update auto top-up settings: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (enabled: boolean, threshold?: number, amount?: number) => {
      return await updateMutation.mutateAsync({
        enabled,
        threshold,
        amount,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to cancel a credits order
 */
export function useCancelCreditsOrder() {
  const { refetchCredits } = useCredits()
  const { refetchCreditsOrders } = useListCreditsOrders()

  const cancelMutation = useMutation(
    orpc.credits.cancelOrder.mutationOptions({
      onSuccess: () => {
        void refetchCredits()
        void refetchCreditsOrders()
      },
      onError: (error) => {
        toast.error(`Failed to cancel order: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (orderId: string) => {
      return await cancelMutation.mutateAsync({
        orderId,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
