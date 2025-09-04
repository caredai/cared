import { useCallback, useEffect } from 'react'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { atom, useAtom } from 'jotai'
import { toast } from 'sonner'

import { useTRPC } from '@/trpc/client'

const PAGE_SIZE = 100

export function useCredits(organizationId?: string) {
  const trpc = useTRPC()

  const {
    data: { credits },
    refetch: refetchCredits,
  } = useSuspenseQuery(
    trpc.credits.getCredits.queryOptions({
      organizationId,
    }),
  )
  return {
    credits,
    refetchCredits,
  }
}

const hasAttemptedFetchAtom = atom(false)

export function useListCreditsOrders(organizationId?: string) {
  const trpc = useTRPC()

  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    trpc.credits.listOrders.infiniteQueryOptions(
      {
        organizationId,
        statuses: ['open', 'complete', 'draft', 'paid'],
        limit: PAGE_SIZE,
      },
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
        placeholderData: keepPreviousData,
        staleTime: 300 * 1000,
        gcTime: 3600 * 1000,
      },
    ),
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

export function useCreateCreditsOnetimeCheckout(organizationId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.credits.createOnetimeCheckout.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listOrders.queryKey({
            organizationId,
            statuses: ['open', 'complete', 'draft', 'paid'],
            limit: PAGE_SIZE,
          }),
        })
      },
    }),
  )

  return useCallback(
    async (credits: number) => {
      return await createMutation.mutateAsync({
        organizationId,
        credits,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizationId],
  )
}

export function useListCreditsSubscriptions(organizationId?: string) {
  const trpc = useTRPC()

  const { data, refetch } = useQuery({
    ...trpc.credits.listSubscriptions.queryOptions({
      organizationId,
    }),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    creditsSubscriptions: data?.subscriptions,
    refetchCreditsSubscriptions: refetch,
  }
}

export function useCreateAutoRechargeCreditsSubscriptionCheckout(organizationId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.credits.createAutoRechargeSubscriptionCheckout.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listOrders.queryKey({
            organizationId,
            statuses: ['open', 'complete', 'draft', 'paid'],
            limit: PAGE_SIZE,
          }),
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listSubscriptions.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(`Failed to create auto top-up subscription checkout: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (autoRechargeThreshold: number, autoRechargeAmount: number) => {
      return await createMutation.mutateAsync({
        organizationId,
        autoRechargeThreshold,
        autoRechargeAmount,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizationId],
  )
}

export function useCancelAutoRechargeCreditsSubscription(organizationId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const cancelMutation = useMutation(
    trpc.credits.cancelAutoRechargeSubscription.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listSubscriptions.queryKey(),
        })
      },
    }),
  )

  return useCallback(async () => {
    return await cancelMutation.mutateAsync({
      organizationId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])
}

export function useCreateAutoRechargeCreditsInvoice(organizationId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.credits.createAutoRechargeInvoice.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listOrders.queryKey({
            organizationId,
            statuses: ['open', 'complete', 'draft', 'paid'],
            limit: PAGE_SIZE,
          }),
        })
      },
    }),
  )

  return useCallback(async () => {
    return await createMutation.mutateAsync({
      organizationId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])
}

/**
 * Hook to cancel a credits order
 */
export function useCancelCreditsOrder(organizationId?: string) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const cancelMutation = useMutation(
    trpc.credits.cancelOrder.mutationOptions({
      onSuccess: () => {
        // Invalidate orders list to refresh the data
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listOrders.queryKey({
            organizationId,
            limit: PAGE_SIZE,
          }),
        })
        // Also invalidate credits to refresh the current credits balance
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.getCredits.queryKey({
            organizationId,
          }),
        })
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
        organizationId,
      })
    },
    [cancelMutation, organizationId],
  )
}
