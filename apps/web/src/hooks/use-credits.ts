import { useCallback, useEffect, useState } from 'react'
import {
  keepPreviousData,
  skipToken,
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
  } = useSuspenseQuery(orpc.account.credits.getCredits.queryOptions())
  return {
    credits,
    refetchCredits,
  }
}

const hasAttemptedFetchAtom = atom(false)

export function useListCreditsTransactions() {
  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    orpc.account.credits.getTransactions.infiniteOptions({
      input: (cursor?: number) => ({
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
      console.log('Fetching credits transactions...')
      setHasAttemptedFetch(true)
      void fetchNextPage().finally(() => setHasAttemptedFetch(false))
    }
  }, [fetchNextPage, hasAttemptedFetch, hasNextPage, isFetchingNextPage, setHasAttemptedFetch])

  return {
    creditsTransactionsPages: data?.pages,
    refetchCreditsTransactions: refetch,
  }
}

export function useCreateCreditsOnetimeTopUp() {
  const topUpMutation = useMutation(orpc.account.credits.topUpCredits.mutationOptions())

  return useCallback(
    async (credits: number) => {
      const { transaction } = await topUpMutation.mutateAsync({ credits })
      return transaction
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Poll credits onetime top-up transaction status using useQuery with refetchInterval.
 * Returns transaction status and automatically stops polling when settled or failed.
 */
export function usePollCreditsOnetimeTopUpStatus(transactionId?: string) {
  const { data, isPending } = useQuery({
    ...orpc.account.credits.getTransaction.queryOptions({
      input: transactionId ? { transactionId } : skipToken,
    }),
    // Poll every 1 second when transaction is pending
    refetchInterval: (query) => {
      const transaction = query.state.data?.transaction
      return transactionId && transaction?.status === 'pending' ? 1000 : false
    },
    enabled: !!transactionId,
  })

  return {
    transaction: data?.transaction,
    status: data?.transaction.status,
    isPending,
  }
}

export function useGenerateCreditsTopUpUrl() {
  const generateUrlMutation = useMutation(orpc.account.credits.generateTopUpUrl.mutationOptions())

  const [creditsTopUpUrl, setCreditsTopUpUrl] = useState<string>()

  const generateCreditsTopUpUrl = useCallback(
    async (transactionId: string) => {
      const { paymentUrl } = await generateUrlMutation.mutateAsync({
        transactionId,
      })
      setCreditsTopUpUrl(paymentUrl)
      return paymentUrl
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return {
    generateCreditsTopUpUrl,
    creditsTopUpUrl,
  }
}

export function useListCreditsSubscriptions() {
  const { data, refetch } = useQuery({
    ...orpc.account.subscriptions.getSubscriptions.queryOptions(),
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
    orpc.account.credits.updateAutoTopUpSettings.mutationOptions({
      onSuccess: () => {
        void refetchCredits()
      },
      onError: (error: Error) => {
        toast.error(`Failed to update auto top-up settings: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (enabled: boolean, threshold?: number, amount?: number) => {
      const autoTopUp = enabled
        ? {
            trigger: 'threshold' as const,
            method: 'fixed' as const,
            thresholdCredits: threshold!.toString(),
            topUpCredits: amount!.toString(),
          }
        : null

      return await updateMutation.mutateAsync({
        autoTopUp,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
