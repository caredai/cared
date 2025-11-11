import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { orpc } from '@/lib/orpc'

/**
 * Hook to get customer information
 */
export function useCustomer() {
  const { data, refetch, isLoading } = useQuery({
    ...orpc.account.stripe.getCustomer.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity,
  })

  return {
    customer: data?.customer,
    refetchCustomer: refetch,
    isLoading,
  }
}

export function useDefaultPaymentMethodId() {
  const { customer } = useCustomer()
  const defaultPaymentMethod = customer?.invoice_settings.default_payment_method
  return typeof defaultPaymentMethod === 'string' ? defaultPaymentMethod : defaultPaymentMethod?.id
}

/**
 * Hook to list payment methods for a customer
 */
export function useListPaymentMethods() {
  const { data, refetch, isLoading } = useQuery({
    ...orpc.account.stripe.listPaymentMethods.queryOptions(),
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
  const queryClient = useQueryClient()

  const addMutation = useMutation(
    orpc.account.stripe.setupAddPaymentMethodIntent.mutationOptions({
      onSuccess: () => {
        // Invalidate payment methods list to refresh the data
        void queryClient.invalidateQueries({
          queryKey: orpc.account.stripe.listPaymentMethods.queryKey(),
        })
      },
      onError: (_error) => {
        // toast.error(`Failed to setup payment method: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async () => {
      return await addMutation.mutateAsync({})
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to remove a payment method
 */
export function useRemovePaymentMethod() {
  const queryClient = useQueryClient()

  const removeMutation = useMutation(
    orpc.account.stripe.removePaymentMethod.mutationOptions({
      onSuccess: () => {
        // Invalidate payment methods list to refresh the data
        void queryClient.invalidateQueries({
          queryKey: orpc.account.stripe.listPaymentMethods.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(`Failed to remove payment method: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (paymentMethodId: string) => {
      return await removeMutation.mutateAsync({
        paymentMethodId,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to update customer's default payment method
 */
export function useUpdateDefaultPaymentMethod() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.stripe.updateDefaultPaymentMethod.mutationOptions({
      onSuccess: () => {
        // Invalidate customer data to refresh the default payment method
        void queryClient.invalidateQueries({
          queryKey: orpc.account.stripe.getCustomer.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(`Failed to update default payment method: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (paymentMethodId: string) => {
      return await updateMutation.mutateAsync({
        paymentMethodId,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
