import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTRPC } from '@/trpc/client'

/**
 * Hook to get customer information
 */
export function useCustomer(organizationId?: string) {
  const trpc = useTRPC()

  const { data, refetch, isLoading } = useQuery({
    ...trpc.stripe.getCustomer.queryOptions({
      organizationId,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity,
  })

  return {
    customer: data?.customer,
    refetchCustomer: refetch,
    isLoading,
  }
}

/**
 * Hook to list payment methods for a customer
 */
export function useListPaymentMethods(organizationId?: string) {
  const trpc = useTRPC()

  const { data, refetch, isLoading } = useQuery({
    ...trpc.stripe.listPaymentMethods.queryOptions({
      organizationId,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity,
  })

  return {
    paymentMethods: data?.paymentMethods,
    refetchPaymentMethods: refetch,
    isLoading,
  }
}

/**
 * Hook to add a new payment method using SetupIntent
 */
export function useAddPaymentMethod() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const addMutation = useMutation(
    trpc.stripe.addPaymentMethod.mutationOptions({
      onSuccess: () => {
        // Invalidate payment methods list to refresh the data
        void queryClient.invalidateQueries({
          queryKey: trpc.stripe.listPaymentMethods.queryKey(),
        })
      },
      onError: (_error) => {
        // toast.error(`Failed to setup payment method: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (organizationId?: string) => {
      return await addMutation.mutateAsync({
        organizationId,
      })
    },
    [addMutation],
  )
}

/**
 * Hook to remove a payment method
 */
export function useRemovePaymentMethod() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const removeMutation = useMutation(
    trpc.stripe.removePaymentMethod.mutationOptions({
      onSuccess: () => {
        // Invalidate payment methods list to refresh the data
        void queryClient.invalidateQueries({
          queryKey: trpc.stripe.listPaymentMethods.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(`Failed to remove payment method: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (paymentMethodId: string, organizationId?: string) => {
      return await removeMutation.mutateAsync({
        paymentMethodId,
        organizationId,
      })
    },
    [removeMutation],
  )
}
