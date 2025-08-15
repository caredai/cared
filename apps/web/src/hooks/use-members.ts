import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

// Query hooks
export function useMembers(organizationId: string) {
  const trpc = useTRPC()

  const {
    data: { members },
  } = useSuspenseQuery(
    trpc.organization.listMembers.queryOptions({
      organizationId,
    }),
  )

  return members
}

export function useInvitations(organizationId: string) {
  const trpc = useTRPC()

  const {
    data: { invitations },
  } = useSuspenseQuery(
    trpc.organization.listInvitations.queryOptions({
      organizationId,
    }),
  )

  return invitations
}

// Mutation hooks
export function useAddMember() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.organization.addMember.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate members list for the specific organization
        void queryClient.invalidateQueries({
          queryKey: trpc.organization.listMembers.queryOptions({
            organizationId: variables.organizationId,
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (organizationId: string, userId: string, role: 'admin' | 'member') => {
    return await mutation.mutateAsync({
      organizationId,
      userId,
      role,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useRemoveMember() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.organization.removeMember.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate members list for the specific organization
        void queryClient.invalidateQueries({
          queryKey: trpc.organization.listMembers.queryOptions({
            organizationId: variables.organizationId,
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (organizationId: string, memberId: string) => {
    return await mutation.mutateAsync({
      organizationId,
      memberId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useUpdateMemberRole() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.organization.updateMemberRole.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate members list for the specific organization
        void queryClient.invalidateQueries({
          queryKey: trpc.organization.listMembers.queryOptions({
            organizationId: variables.organizationId,
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (organizationId: string, memberId: string, role: 'admin' | 'member') => {
    return await mutation.mutateAsync({
      organizationId,
      memberId,
      role,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useCreateInvitation() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.organization.createInvitation.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate invitations list for the specific organization
        void queryClient.invalidateQueries({
          queryKey: trpc.organization.listInvitations.queryOptions({
            organizationId: variables.organizationId,
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (organizationId: string, email: string) => {
    return await mutation.mutateAsync({
      organizationId,
      email,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useCancelInvitation() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    trpc.organization.cancelInvitation.mutationOptions({
      onSuccess: (data) => {
        // Invalidate invitations list for the specific organization
        void queryClient.invalidateQueries({
          queryKey: trpc.organization.listInvitations.queryOptions({
            organizationId: data.invitation.organizationId,
          }).queryKey,
        })
      },
    }),
  )

  return useCallback(async (organizationId: string, invitationId: string) => {
    return await mutation.mutateAsync({
      invitationId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
