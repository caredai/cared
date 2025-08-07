import { useCallback } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTRPC } from '@/trpc/client'

export function useCredits() {
  const trpc = useTRPC()

  const {
    data: { credits },
    refetch: refetchCredits,
  } = useSuspenseQuery(trpc.credits.getCredits.queryOptions())
  return {
    credits,
    refetchCredits,
  }
}

export function useCreateCreditsOnetimeCheckout() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.credits.createOnetimeCheckout.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listOrders.queryKey(),
        })
      },
    }),
  )

  return useCallback(async (credits: number) => {
    return await createMutation.mutateAsync({
      credits,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useListCreditsOrders() {
  const trpc = useTRPC()

  const { data, refetch } = useInfiniteQuery(
    trpc.credits.listOrders.infiniteQueryOptions(
      {
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined
          return lastPage.cursor
        },
        staleTime: 300 * 1000,
        gcTime: 3600 * 1000,
      },
    ),
  )

  return {
    creditsOrdersPages: data?.pages,
    refetchCreditsOrders: refetch,
  }
}

export function useListCreditsSubscriptions() {
  const trpc = useTRPC()

  const { data, refetch } = useQuery({
    ...trpc.credits.listSubscriptions.queryOptions(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    creditsSubscriptions: data?.subscriptions,
    refetchCreditsSubscriptions: refetch,
  }
}

export function useCreateAutoRechargeCreditsSubscriptionCheckout() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.credits.createAutoRechargeSubscriptionCheckout.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listOrders.queryKey(),
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

  return useCallback(async (autoRechargeThreshold: number, autoRechargeAmount: number) => {
    return await createMutation.mutateAsync({
      autoRechargeThreshold,
      autoRechargeAmount,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useCancelAutoRechargeCreditsSubscription() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.credits.cancelAutoRechargeSubscription.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listSubscriptions.queryKey(),
        })
      },
    }),
  )

  return mutation
}

export function useCreateAutoRechargeCreditsInvoice() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.credits.createAutoRechargeInvoice.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.credits.listOrders.queryKey(),
        })
      },
    }),
  )

  return useCallback(async () => {
    return await createMutation.mutateAsync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
