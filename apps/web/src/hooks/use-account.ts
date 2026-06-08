import { useCallback, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSessionPublic } from '@/hooks/use-session'
import { orpc } from '@/lib/orpc'

export type Account = ReturnType<typeof useAccounts>[number]

export function useSetLastAccount() {
  const { session, refetchSession } = useSessionPublic()

  const setActiveMutation = useMutation(orpc.user.setActiveAccount.mutationOptions())

  const [disabledSetLastAccount, setDisabledSetLastAccount] = useState(false)

  const setLastAccount = useCallback(
    async (id?: string, disable?: boolean) => {
      if (id === (session?.activeAccountId ?? undefined)) {
        return
      }
      console.log('set active account', id)
      await setActiveMutation.mutateAsync({
        id: id ?? null,
      })
      if (disable) {
        setDisabledSetLastAccount(true)
      }
      await refetchSession()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.activeAccountId],
  )

  return {
    setLastAccount,
    disabledSetLastAccount,
  }
}

export function useAccounts() {
  const {
    data: { accounts },
  } = useSuspenseQuery(orpc.account.account.list.queryOptions())

  return accounts
}

/**
 * Hook for updating account information
 * Provides mutation for updating account name and other properties
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.account.update.mutationOptions({
      onSuccess: () => {
        // Invalidate account queries to refresh data
        void queryClient.invalidateQueries(orpc.account.account.list.queryOptions())
      },
      onError: (error) => {
        console.error('Failed to update account:', error)
        toast.error('Failed to update account')
      },
    }),
  )

  return useCallback(
    async (input: { name: string }) => {
      return await updateMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook for transferring account ownership to another member
 * Provides mutation for transferring ownership between members
 */
export function useTransferAccountOwnership() {
  const queryClient = useQueryClient()

  const transferMutation = useMutation(
    orpc.account.account.transferOwnership.mutationOptions({
      onSuccess: () => {
        // Invalidate account queries to refresh data
        void queryClient.invalidateQueries(orpc.account.account.list.queryOptions())
      },
      onError: (error) => {
        console.error('Failed to transfer account ownership:', error)
        toast.error('Failed to transfer account ownership')
      },
    }),
  )

  return useCallback(
    async (input: { memberId: string }) => {
      return await transferMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
