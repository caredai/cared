import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { UpdateModelArgs, UpdateModelsArgs } from '@cared/api'
import type { ModelFullId, ModelType, ProviderId } from '@cared/providers'

import { useTRPC } from '@/trpc/client'

export function useDefaultModels() {
  const trpc = useTRPC()

  const {
    data: { defaultModels },
  } = useSuspenseQuery(trpc.model.listDefaultModels.queryOptions())

  return {
    defaultModels,
  }
}

export function useProviders() {
  const trpc = useTRPC()

  const {
    data: { providers },
    refetch: refetchProviders,
  } = useSuspenseQuery(trpc.model.listProviders.queryOptions())

  return {
    providers,
    refetchProviders,
  }
}

export function useProvidersModels(input?: {
  organizationId?: string
  type?: ModelType
  source?: 'system' | 'custom'
}) {
  const trpc = useTRPC()

  const {
    data: { models },
    refetch: refetchProvidersModels,
  } = useSuspenseQuery(trpc.model.listProvidersModels.queryOptions(input))

  return {
    models,
    refetchProvidersModels,
  }
}

export function useModels(input?: {
  organizationId?: string
  type?: ModelType
  source?: 'system' | 'custom'
}) {
  const trpc = useTRPC()

  const {
    data: { models },
    refetch: refetchModels,
  } = useSuspenseQuery(trpc.model.listModels.queryOptions(input))

  return {
    models,
    refetchModels,
  }
}

export function useUpdateModel({
  isSystem,
  organizationId,
}: {
  isSystem?: boolean
  organizationId?: string
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.model.updateModel.mutationOptions({
      onSuccess: () => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to update model:', error)
        toast.error(`Failed to update model: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (
      input: {
        providerId: ProviderId
      } & UpdateModelArgs,
    ) => {
      return await updateMutation.mutateAsync({
        isSystem,
        organizationId,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useUpdateModels({
  isSystem,
  organizationId,
}: {
  isSystem?: boolean
  organizationId?: string
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.model.updateModels.mutationOptions({
      onSuccess: () => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to update models:', error)
        toast.error(`Failed to update models: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (
      input: {
        providerId: ProviderId
      } & UpdateModelsArgs,
    ) => {
      return await updateMutation.mutateAsync({
        isSystem,
        organizationId,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useDeleteModel({
  isSystem,
  organizationId,
}: {
  isSystem?: boolean
  organizationId?: string
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.model.deleteModel.mutationOptions({
      onSuccess: () => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to delete model:', error)
        toast.error(`Failed to delete model: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { id: ModelFullId; type: ModelType }) => {
      return await deleteMutation.mutateAsync({
        isSystem,
        organizationId,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useDeleteModels({
  isSystem,
  organizationId,
}: {
  isSystem?: boolean
  organizationId?: string
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.model.deleteModels.mutationOptions({
      onSuccess: () => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId,
            source: isSystem ? 'system' : undefined,
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to delete models:', error)
        toast.error(`Failed to delete models: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { providerId: ProviderId; ids: ModelFullId[]; type: ModelType }) => {
      return await deleteMutation.mutateAsync({
        isSystem,
        organizationId,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
