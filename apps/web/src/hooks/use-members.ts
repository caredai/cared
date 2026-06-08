import { useCallback, useMemo } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'

import type { RouterOutputs } from '@cared/api'

import { orpc } from '@/lib/orpc'

export type Member = RouterOutputs['account']['account']['listMembers']['members'][number]

// Query hooks
export function useMembers() {
  const {
    data: { members },
  } = useSuspenseQuery(orpc.account.account.listMembers.queryOptions())

  return { members }
}

/** Resolve account member display name from a User id (used for account-scoped API tokens). */
export function useMemberNameLookup(members: Member[]) {
  const getMemberByUserId = useMemberByUserIdLookup(members)

  return useMemo(
    () => (userId: string | null | undefined): string => getMemberByUserId(userId)?.user.name ?? '',
    [getMemberByUserId],
  )
}

/** Resolve account member from a User id (used for account-scoped API tokens). */
export function useMemberByUserIdLookup(members: Member[]) {
  return useMemo(() => {
    const userIdToMemberMap = new Map<string, Member>()
    for (const member of members) {
      if (member.user.id) {
        userIdToMemberMap.set(member.user.id, member)
      }
    }

    return (userId: string | null | undefined): Member | undefined => {
      if (!userId) return undefined
      return userIdToMemberMap.get(userId)
    }
  }, [members])
}

export function useInvitations() {
  const {
    data: { invitations },
  } = useSuspenseQuery(orpc.account.account.listInvitations.queryOptions())

  return { invitations }
}

// Mutation hooks
export function useAddMember() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.addMember.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listMembers.queryOptions().queryKey,
        })
      },
    }),
  )

  return useCallback(async (userId: string, role: 'admin' | 'member') => {
    return await mutation.mutateAsync({
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
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listMembers.queryOptions().queryKey,
        })
      },
    }),
  )

  return useCallback(async (memberId: string) => {
    return await mutation.mutateAsync({
      memberId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.updateMemberRole.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listMembers.queryOptions().queryKey,
        })
      },
    }),
  )

  return useCallback(async (memberId: string, role: 'admin' | 'member') => {
    return await mutation.mutateAsync({
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
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listInvitations.queryOptions().queryKey,
        })
      },
    }),
  )

  return useCallback(async (email: string) => {
    return await mutation.mutateAsync({
      email,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.account.account.cancelInvitation.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.account.listInvitations.queryOptions().queryKey,
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
