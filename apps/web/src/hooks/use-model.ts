import { useCallback, useMemo } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ModelType } from '@cared/providers'

import { useTRPC } from '@/trpc/client'

// Hook for listing default models
export function useDefaultModels() {
  const trpc = useTRPC()

  const { data: { defaultModels } } = useSuspenseQuery(
    trpc.model.listDefaultModels.queryOptions(),
  )

  return {
    defaultModels,
  }
}

// Hook for listing all providers
export function useProviders() {
  const trpc = useTRPC()

  const { data: { providers } } = useSuspenseQuery(
    trpc.model.listProviders.queryOptions(),
  )

  return {
    providers,
  }
}

// Hook for listing providers with models
export function useProvidersModels(input?: {
  organizationId?: string
  type?: ModelType
  source?: 'system' | 'custom'
}) {
  const trpc = useTRPC()

  const {
    data: { models },
    refetch: refetchProvidersModels,
  } = useSuspenseQuery(
    trpc.model.listProvidersModels.queryOptions(input),
  )

  return {
    models,
    refetchProvidersModels,
  }
}

// Hook for listing all models
export function useModels(input?: {
  organizationId?: string
  type?: ModelType
  source?: 'system' | 'custom'
}) {
  const trpc = useTRPC()

  const {
    data: { models },
    refetch: refetchModels,
  } = useSuspenseQuery(
    trpc.model.listModels.queryOptions(input),
  )

  return {
    models,
    refetchModels,
  }
}

// Hook for updating a single model
export function useUpdateModel() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.model.updateModel.mutationOptions({
      onSuccess: ({ model }) => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId: model.isSystem ? undefined : model.organizationId,
            type: getModelTypeFromModel(model),
            source: model.isSystem ? 'system' : 'custom',
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId: model.isSystem ? undefined : model.organizationId,
            type: getModelTypeFromModel(model),
            source: model.isSystem ? 'system' : 'custom',
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
    async (input: {
      organizationId?: string
      providerId: string
      isSystem?: boolean
      type: ModelType
      model: any
    }) => {
      return await updateMutation.mutateAsync(input)
    },
    [updateMutation],
  )
}

// Hook for updating multiple models
export function useUpdateModels() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.model.updateModels.mutationOptions({
      onSuccess: ({ models }, variables) => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId: variables.organizationId,
            type: variables.type,
            source: variables.isSystem ? 'system' : 'custom',
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId: variables.organizationId,
            type: variables.type,
            source: variables.isSystem ? 'system' : 'custom',
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
    async (input: {
      organizationId?: string
      providerId: string
      isSystem?: boolean
      type: ModelType
      models: any[]
    }) => {
      return await updateMutation.mutateAsync(input)
    },
    [updateMutation],
  )
}

// Hook for deleting a single model
export function useDeleteModel() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.model.deleteModel.mutationOptions({
      onSuccess: ({ model }) => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId: model.isSystem ? undefined : model.organizationId,
            type: getModelTypeFromModel(model),
            source: model.isSystem ? 'system' : 'custom',
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId: model.isSystem ? undefined : model.organizationId,
            type: getModelTypeFromModel(model),
            source: model.isSystem ? 'system' : 'custom',
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
    async (input: {
      organizationId?: string
      id: string
      type: ModelType
      isSystem?: boolean
    }) => {
      return await deleteMutation.mutateAsync(input)
    },
    [deleteMutation],
  )
}

// Hook for deleting multiple models
export function useDeleteModels() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.model.deleteModels.mutationOptions({
      onSuccess: ({ models }, variables) => {
        // Invalidate relevant queries
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listModels.queryOptions({
            organizationId: variables.organizationId,
            type: variables.type,
            source: variables.isSystem ? 'system' : 'custom',
          }).queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: trpc.model.listProvidersModels.queryOptions({
            organizationId: variables.organizationId,
            type: variables.type,
            source: variables.isSystem ? 'system' : 'custom',
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
    async (input: {
      organizationId?: string
      providerId: string
      ids: string[]
      type: ModelType
      isSystem?: boolean
    }) => {
      return await deleteMutation.mutateAsync(input)
    },
    [deleteMutation],
  )
}

// Utility function to get model type from model object
function getModelTypeFromModel(model: any): ModelType {
  // This is a helper function to determine the model type
  // You might need to adjust this based on your actual model structure
  if (model.languageModels) return 'language'
  if (model.imageModels) return 'image'
  if (model.speechModels) return 'speech'
  if (model.transcriptionModels) return 'transcription'
  if (model.textEmbeddingModels) return 'textEmbedding'

  // Default fallback
  return 'language'
}

// Convenience hooks for specific use cases
export function useSystemModels(type?: ModelType) {
  return useModels({ source: 'system', type })
}

export function useCustomModels(organizationId?: string, type?: ModelType) {
  return useModels({ source: 'custom', organizationId, type })
}

export function useOrganizationModels(organizationId: string, type?: ModelType) {
  return useModels({ organizationId, type })
}

export function useUserModels(type?: ModelType) {
  return useModels({ type })
}

export function useSystemProvidersModels(type?: ModelType) {
  return useProvidersModels({ source: 'system', type })
}

export function useCustomProvidersModels(organizationId?: string, type?: ModelType) {
  return useProvidersModels({ source: 'custom', organizationId, type })
}

export function useOrganizationProvidersModels(organizationId: string, type?: ModelType) {
  return useProvidersModels({ organizationId, type })
}

export function useUserProvidersModels(type?: ModelType) {
  return useProvidersModels({ type })
}
