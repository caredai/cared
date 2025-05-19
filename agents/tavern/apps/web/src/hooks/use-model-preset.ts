import type { AppRouter } from '@tavern/api'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { ModelPresetCustomization, modelPresetSchema, promptSchema } from '@tavern/core'
import { deepmerge } from 'deepmerge-ts'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'

import { debounceTimeout } from '@/lib/debounce'
import { useModelPresetSettings, useUpdateModelPresetSettings } from '@/lib/settings'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type ModelPreset = RouterOutput['modelPreset']['get']['modelPreset']

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

  const setActivePreset = async (preset: ModelPreset | string) => {
    await updateModelPresetSettings({ preset: typeof preset === 'string' ? preset : preset.name })
  }

  // If the active preset doesn't exist, use the first preset and update settings
  if (!activePreset) {
    void setActivePreset(modelPresets[0]!.name)
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

  return useCallback(async (name: string, preset: ModelPreset['preset']) => {
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
              preset: {
                ...modelPreset.preset,
                ...newData.preset,
              },
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
    async (id: string, preset: Partial<ModelPreset['preset']>) => {
      return await mutation.mutateAsync({
        id,
        preset,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useCustomizeModelPreset() {
  const modelPresetSettings = useModelPresetSettings()
  const updateModelPresetSettings = useUpdateModelPresetSettings()

  const { activePreset } = useActiveModelPreset()

  const customization = modelPresetSettings.customizations?.[activePreset.name]

  const saveCustomization = useCallback(
    (values: ModelPresetCustomization) => {
      const newCustomization = {
        ...customization,
        ...values,
      }

      // Check whether the customization is valid
      const _ = modelPresetWithCustomization(activePreset.preset, newCustomization)

      return updateModelPresetSettings({
        customizations: {
          ...modelPresetSettings.customizations,
          [activePreset.name]: newCustomization,
        },
      })
    },
    [
      activePreset,
      customization,
      modelPresetSettings,
      updateModelPresetSettings,
    ],
  )

  const updateModelPreset = useUpdateModelPreset()

  const updateModelPresetWithCustomization = useCallback(async () => {
    const { [activePreset.name]: customization, ...customizations } =
      modelPresetSettings.customizations ?? {}

    if (!customization) {
      return
    }

    const modelPreset = modelPresetWithCustomization(activePreset.preset, customization)

    await Promise.all([
      updateModelPresetSettings({
        // Delete the customization for the model preset
        customizations,
      }),
      updateModelPreset(activePreset.id, modelPreset),
    ])
  }, [activePreset, modelPresetSettings, updateModelPreset, updateModelPresetSettings])

  return {
    customization,
    saveCustomization,
    updateModelPresetWithCustomization,
  }
}

function modelPresetWithCustomization(
  modelPreset: ModelPreset['preset'],
  customization: ModelPresetCustomization | undefined,
): ModelPreset['preset'] {
  if (!customization) {
    return modelPreset
  }

  const { utilityPrompts, prompts, promptOrder, vendor, ...otherCustomization } = customization

  // Merge prompts with null handling for deletion
  let newPrompts = [...modelPreset.prompts]
  if (prompts) {
    Object.entries(prompts).forEach(([identifier, prompt]) => {
      const index = newPrompts.findIndex((p) => p.identifier === identifier)
      if (prompt === null) {
        // Remove prompt if null
        if (index !== -1) {
          newPrompts.splice(index, 1)
        }
      } else {
        // Update or add prompt
        if (index !== -1) {
          newPrompts[index] = { ...newPrompts[index]!, ...prompt }
        } else {
          newPrompts.push(promptSchema.parse(prompt))
        }
      }
    })
  }

  // Reorder prompts if promptOrder is provided
  if (promptOrder) {
    // Verify promptOrder matches prompts exactly
    const promptIdentifiers = new Set(newPrompts.map((p) => p.identifier))
    const orderIdentifiers = new Set(promptOrder)
    if (
      promptIdentifiers.size !== orderIdentifiers.size ||
      ![...promptIdentifiers].every((id) => orderIdentifiers.has(id))
    ) {
      throw new Error(
        `promptOrder does not match prompts exactly. Expected ${promptIdentifiers.size} unique identifiers.`,
      )
    }

    // Reorder prompts according to promptOrder
    newPrompts = promptOrder.map(
      (identifier) => newPrompts.find((p) => p.identifier === identifier)!,
    )
  }

  const newModelPreset: ModelPreset['preset'] = {
    ...modelPreset,
    ...otherCustomization,
    utilityPrompts: {
      ...modelPreset.utilityPrompts,
      ...utilityPrompts,
    },
    prompts: newPrompts,
    vendor: deepmerge(modelPreset.vendor, vendor),
  }

  return modelPresetSchema.parse(newModelPreset)
}
