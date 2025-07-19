import { ModelPreset, ModelPresetCustomization, modelPresetCustomizationSchema } from '@tavern/core'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { modelPresetWithCustomization, sanitizeModelPresetCustomization } from '@tavern/core'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { useModelPresetSettings, useUpdateModelPresetSettings } from '@/hooks/use-settings'
import { debounceTimeout } from '@/lib/debounce'
import { useTRPC } from '@/trpc/client'

export function useModelPresets() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.modelPreset.list.queryOptions(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    modelPresets: data.modelPresets,
    refetchModelPresets: refetch,
  }
}

export function useActiveModelPreset() {
  const modelPresetSettings = useModelPresetSettings()
  const { modelPresets } = useModelPresets()
  const updateModelPresetSettings = useUpdateModelPresetSettings()

  // Find the active preset by name
  let activePreset = modelPresets.find((preset) => preset.name === modelPresetSettings.preset)

  const setActivePreset = useCallback(
    async (preset: string) => {
      await updateModelPresetSettings({ preset })
    },
    [updateModelPresetSettings],
  )

  useEffect(() => {
    if (!activePreset) {
      void setActivePreset(modelPresets[0]!.name)
    }
  }, [modelPresets, activePreset, setActivePreset])

  // If the active preset doesn't exist, use the first preset
  if (!activePreset) {
    activePreset = modelPresets[0]!
  }

  return {
    activePreset,
    setActivePreset,
  }
}

export function useCreateModelPreset() {
  const trpc = useTRPC()
  const { refetchModelPresets } = useModelPresets()

  const createMutation = useMutation(
    trpc.modelPreset.create.mutationOptions({
      onSuccess: () => {
        void refetchModelPresets()
      },
      onError: (error) => {
        toast.error(`Failed to create model preset: ${error.message}`)
      },
    }),
  )

  return useCallback(async (name: string, preset: ModelPreset) => {
    return await createMutation.mutateAsync({
      name,
      preset,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useUpdateModelPreset() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.modelPreset.update.mutationOptions({
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: trpc.modelPreset.list.queryKey() })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(trpc.modelPreset.list.queryKey())

      // Optimistically update to the new value
      queryClient.setQueryData(trpc.modelPreset.list.queryKey(), (old) => {
        if (!old) {
          return undefined
        }
        const index = old.modelPresets.findIndex((preset) => preset.id === newData.id)
        const modelPreset = old.modelPresets[index]!
        return {
          modelPresets: [
            ...old.modelPresets.slice(0, index),
            {
              ...modelPreset,
              ...(newData.preset && {
                preset: {
                  ...modelPreset.preset,
                  ...newData.preset,
                },
              }),
              ...(newData.customization !== undefined && {
                customization: newData.customization ?? undefined,
              }),
            },
            ...old.modelPresets.slice(index + 1),
          ],
        }
      })

      // Return a context object with the snapshotted value
      return { previousData }
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(trpc.modelPreset.list.queryKey(), context.previousData)
      }
      console.error('Failed to update model preset:', error)
      toast.error(`Failed to update model preset: ${error.message}`)
    },
  })

  const mutationFnRef = useRef(mutationOptions.mutationFn)
  mutationFnRef.current = mutationOptions.mutationFn

  // @ts-ignore
  const mutationFn = useCallback((...args: any[]) => mutationFnRef.current?.(...args), [])

  // @ts-ignore
  mutationOptions.mutationFn = useMemo(
    () => pDebounce(mutationFn, debounceTimeout.extended),
    [mutationFn],
  )

  const mutation = useMutation(mutationOptions)
  const mutateAsync = mutation.mutateAsync
  mutation.mutateAsync = (variables) =>
    mutateAsync(variables, {
      onSuccess: (data) => {
        // Will execute only once, for the last mutation
        queryClient.setQueryData(trpc.modelPreset.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const index = old.modelPresets.findIndex((preset) => preset.id === data.modelPreset.id)
          return {
            modelPresets: [
              ...old.modelPresets.slice(0, index),
              data.modelPreset,
              ...old.modelPresets.slice(index + 1),
            ],
          }
        })
      },
    })

  return useCallback(
    async (
      id: string,
      {
        preset,
        customization,
      }: {
        preset?: Partial<ModelPreset>
        customization?: ModelPresetCustomization | null // null means clear customization
      },
    ) => {
      return await mutation.mutateAsync({
        id,
        preset,
        customization,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useCustomizeModelPreset() {
  const { activePreset } = useActiveModelPreset()
  const updateModelPreset = useUpdateModelPreset()

  const customization = activePreset.customization

  const activeCustomizedPreset = useMemo(
    () => modelPresetWithCustomization(activePreset.preset, customization),
    [activePreset, customization],
  )

  const saveCustomization = useCallback(
    async (values: ModelPresetCustomization) => {
      // Ensure values are valid
      values = modelPresetCustomizationSchema.parse(values)

      let newCustomization: ModelPresetCustomization | undefined = {
        ...customization,
        ...values,
      }

      if (hash(newCustomization) === hash(customization)) {
        // No changes detected, do not update
        return
      }

      // Check whether the customization is valid
      let _ = modelPresetWithCustomization(activePreset.preset, newCustomization)
      // Sanitize the customization
      newCustomization = sanitizeModelPresetCustomization(newCustomization, activePreset.preset)
      // Check again
      _ = modelPresetWithCustomization(activePreset.preset, newCustomization)

      if (hash(newCustomization) === hash(customization)) {
        // No changes detected, do not update
        return
      }

      return await updateModelPreset(activePreset.id, {
        customization: newCustomization ?? null, // If newCustomization is empty, clear customization
      })
    },
    [
      activePreset,
      customization,
      updateModelPreset,
    ],
  )

  const updateModelPresetWithCustomization = useCallback(async () => {
    if (!customization) {
      return
    }

    const modelPreset = modelPresetWithCustomization(activePreset.preset, customization)

    await updateModelPreset(activePreset.id, {
      preset: modelPreset,
      customization: null, // Clear customization
    })
  }, [activePreset, customization, updateModelPreset])

  const restoreModelPreset = useCallback(async () => {
    if (!customization) {
      return
    }

    await updateModelPreset(activePreset.id, {
      customization: null, // Clear customization
    })
  }, [activePreset, customization, updateModelPreset])

  const hasPromptsCustomization = useMemo(() => {
    return Boolean(customization?.prompts ?? customization?.promptOrder)
  }, [customization])

  const restoreModelPresetPrompts = useCallback(async () => {
    if (!hasPromptsCustomization) {
      return
    }

    await saveCustomization({
      prompts: undefined,
      promptOrder: undefined,
    })
  }, [hasPromptsCustomization, saveCustomization])

  return {
    activeCustomizedPreset,
    customization,
    saveCustomization,
    updateModelPresetWithCustomization,
    restoreModelPreset,
    hasPromptsCustomization,
    restoreModelPresetPrompts,
  }
}

export function useDeleteModelPreset() {
  const trpc = useTRPC()
  const { refetchModelPresets } = useModelPresets()

  const deleteMutation = useMutation(
    trpc.modelPreset.delete.mutationOptions({
      onSuccess: () => {
        void refetchModelPresets()
      },
      onError: (error) => {
        toast.error(`Failed to delete model preset: ${error.message}`)
      },
    }),
  )

  return useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync({
      id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
