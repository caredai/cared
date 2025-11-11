import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { UpdateModelArgs, UpdateModelsArgs } from '@cared/api'
import type { ModelFullId, ModelType, ProviderId } from '@cared/providers'

import type { QueryClient } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'

export function useProviders() {
  const {
    data: { providers },
    refetch: refetchProviders,
  } = useSuspenseQuery(orpc.account.model.listProviders.queryOptions())

  return {
    providers,
    refetchProviders,
  }
}

export function useProvidersModels(input?: { type?: ModelType; source: 'system' | 'effective' }) {
  const {
    data: { models },
    refetch: refetchProvidersModels,
  } = useSuspenseQuery(orpc.account.model.listProvidersModels.queryOptions({ input }))

  return {
    models,
    refetchProvidersModels,
  }
}

export function useModels(input?: { type?: ModelType; source: 'system' | 'effective' }) {
  const {
    data: { models },
    refetch: refetchModels,
  } = useSuspenseQuery(orpc.account.model.listModels.queryOptions({ input }))

  return {
    models,
    refetchModels,
  }
}

function invalidateModelQueries(source: 'system' | 'custom', queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    // Use partial matching key
    queryKey: orpc.account.model.listProvidersModels.key({
      input: {
        source: source === 'system' ? 'system' : 'effective',
      },
    }),
  })
  void queryClient.invalidateQueries({
    // Use partial matching key
    queryKey: orpc.account.model.listModels.key({
      input: {
        source: source === 'system' ? 'system' : 'effective',
      },
    }),
  })
}

export function useUpdateModel(source: 'system' | 'custom') {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.model.updateModel.mutationOptions({
      onSuccess: () => {
        invalidateModelQueries(source, queryClient)
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
        source,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  )
}

export function useUpdateModels(source: 'system' | 'custom') {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.model.updateModels.mutationOptions({
      onSuccess: () => {
        invalidateModelQueries(source, queryClient)
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
        source,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  )
}

export function useDeleteModel(source: 'system' | 'custom') {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.model.deleteModel.mutationOptions({
      onSuccess: () => {
        invalidateModelQueries(source, queryClient)
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
        source,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  )
}

export function useDeleteModels(source: 'system' | 'custom') {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.model.deleteModels.mutationOptions({
      onSuccess: () => {
        invalidateModelQueries(source, queryClient)
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
        source,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  )
}

export function useSortModels(source: 'system' | 'custom') {
  const queryClient = useQueryClient()

  const sortMutation = useMutation(
    orpc.account.model.sortModels.mutationOptions({
      onSuccess: () => {
        invalidateModelQueries(source, queryClient)
      },
      onError: (error) => {
        console.error('Failed to sort models:', error)
        toast.error(`Failed to sort models: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { providerId: ProviderId; type: ModelType; ids: ModelFullId[] }) => {
      return await sortMutation.mutateAsync({
        source,
        ...input,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  )
}
