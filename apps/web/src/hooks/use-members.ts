import { useCallback } from 'react'
import { skipToken, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

// Query hooks
export function useMembers(accountId?: string) {
  const {
    data: { members },
  } = useSuspenseQuery(
    orpc.account.account.listMembers.queryOptions({
      input: accountId
        ? {
            accountId,
          }
        : skipToken,
    }),
  )

  return members
}

export function useInvitations(accountId?: string) {
  const {
    data: { invitations },
  } = useSuspenseQuery(
    orpc.account.account.listInvitations.queryOptions({
      input: accountId
        ? {
            accountId,
          }
        : skipToken,
    }),
  )

  return invitations
}

// Mutation hooks
export function useAddMember() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.addMember.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate members list for the specific account
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listMembers.queryOptions({
            input: {
              accountId: variables.accountId,
            },
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (accountId: string, userId: string, role: 'admin' | 'member') => {
    return await mutation.mutateAsync({
      accountId,
      userId,
      role,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.removeMember.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate members list for the specific account
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listMembers.queryOptions({
            input: {
              accountId: variables.accountId,
            },
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (accountId: string, memberId: string) => {
    return await mutation.mutateAsync({
      accountId,
      memberId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.updateMemberRole.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate members list for the specific account
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listMembers.queryOptions({
            input: {
              accountId: variables.accountId,
            },
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (accountId: string, memberId: string, role: 'admin' | 'member') => {
    return await mutation.mutateAsync({
      accountId,
      memberId,
      role,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.createInvitation.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate invitations list for the specific account
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listInvitations.queryOptions({
            input: {
              accountId: variables.accountId,
            },
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (accountId: string, email: string) => {
    return await mutation.mutateAsync({
      accountId,
      email,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.cancelInvitation.mutationOptions({
      onSuccess: (data) => {
        // Invalidate invitations list for the specific account
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listInvitations.queryOptions({
            input: {
              accountId: data.invitation.accountId,
            },
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (invitationId: string) => {
    return await mutation.mutateAsync({
      invitationId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
