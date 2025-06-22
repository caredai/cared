import type { ModelPresetSettings, ModelSettings, Settings, TagsSettings } from '@tavern/core'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { useCharacters } from '@/hooks/use-character'
import { useCharacterGroups } from '@/hooks/use-character-group'
import { debounceTimeout } from '@/lib/debounce'
import { useTRPC } from '@/trpc/client'

export function useUpdateSettingsMutation() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.settings.update.mutationOptions({
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: trpc.settings.get.queryKey() })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(trpc.settings.get.queryKey())

      // Optimistically update to the new value
      queryClient.setQueryData(
        trpc.settings.get.queryKey(),
        (old) =>
          old && {
            settings: { ...old.settings, ...newData.settings },
          },
      )

      // Return a context object with the snapshotted value
      return { previousData }
    },
    onSuccess: (_data) => {
      // queryClient.setQueryData(trpc.settings.get.queryKey(), data)
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(trpc.settings.get.queryKey(), context.previousData)
      }
      console.error('Failed to save settings:', error)
      toast.error(`Failed to save settings: ${error.message}`)
    },
    // Always refetch after error or success
    // onSettled: () => queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() }),
  })

  const mutationFnRef = useRef(mutationOptions.mutationFn)
  mutationFnRef.current = mutationOptions.mutationFn

  // @ts-ignore
  const mutationFn = useCallback((...args: any[]) => mutationFnRef.current?.(...args), [])

  // @ts-ignore
  mutationOptions.mutationFn = useMemo(
    () => pDebounce(mutationFn, debounceTimeout.relaxed),
    [mutationFn],
  )

  const mutation = useMutation(mutationOptions)
  const mutateAsync = mutation.mutateAsync
  mutation.mutateAsync = (variables) =>
    mutateAsync(variables, {
      onSuccess: (data) => {
        // Will execute only once, for the last mutation
        queryClient.setQueryData(trpc.settings.get.queryKey(), data)
      },
    })

  const {
    data: { settings },
  } = useSuspenseQuery(trpc.settings.get.queryOptions())

  return useCallback(
    async (updates: Partial<Settings>) => {
      if (
        hash({
          ...settings,
          ...updates,
        }) === hash(settings)
      ) {
        return
      }

      return await mutation.mutateAsync({ settings: updates })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings],
  )
}

export function useSettings() {
  const trpc = useTRPC()
  const {
    data: { settings },
  } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
  })
  return settings
}

export function useBackgroundSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.background, []),
  })
  return data
}

export function useAppearanceSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.appearance, []),
  })
  return data
}

export function useTagsSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.tags, []),
  })
  return data
}

export function useUpdateTagsSettings() {
  const tagsSettings = useTagsSettings()
  const updateSettings = useUpdateSettingsMutation()

  return useCallback(
    async (tags: Partial<TagsSettings>) => {
      const newTagsSettings = {
        ...tagsSettings,
        ...tags,
      }
      for (const [id, tags] of Object.entries(newTagsSettings.tagMap)) {
        if (!tags.length) {
          delete newTagsSettings.tagMap[id]
        }
      }

      console.log(newTagsSettings)
      await updateSettings({
        tags: newTagsSettings,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tagsSettings],
  )
}

export function useClearTagMap() {
  const tagsSettings = useTagsSettings()
  const updateSettings = useUpdateSettingsMutation()

  const { characters } = useCharacters()
  const { groups } = useCharacterGroups()

  return useCallback(
    async (ids: string[]) => {
      const newTagMap = { ...tagsSettings.tagMap }

      for (const id of ids) {
        delete newTagMap[id]
      }

      for (const [id, tags] of Object.entries(newTagMap)) {
        if (!tags.length) {
          delete newTagMap[id]
          continue
        }
        const character = characters.find((c) => c.id === id)
        const group = groups.find((g) => g.id === id)
        if (!character && !group) {
          delete newTagMap[id]
        }
      }

      await updateSettings({
        tags: {
          ...tagsSettings,
          tagMap: newTagMap,
        },
      })
    },
    [characters, groups, tagsSettings, updateSettings],
  )
}

export function useModelPresetSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.modelPreset, []),
  })
  return data
}

export function useUpdateModelPresetSettings() {
  const modelPresetSettings = useModelPresetSettings()
  const updateSettings = useUpdateSettingsMutation()

  return useCallback(
    async (modelPreset: Partial<ModelPresetSettings>) => {
      await updateSettings({
        modelPreset: {
          ...modelPresetSettings,
          ...modelPreset,
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelPresetSettings],
  )
}

export function useModelSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.model, []),
  })
  return data
}

export function useUpdateModelSettings() {
  const modelSettings = useModelSettings()
  const updateSettings = useUpdateSettingsMutation()

  return useCallback(
    async (modelSettingsValues: Partial<ModelSettings>) => {
      await updateSettings({
        model: {
          ...modelSettings,
          ...modelSettingsValues,
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelSettings],
  )
}

export function useLorebookSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.lorebook, []),
  })
  return data
}

export function useUpdateLorebookSettings() {
  const lorebookSettings = useLorebookSettings()
  const updateSettings = useUpdateSettingsMutation()

  return useCallback(
    async (lorebook: Partial<Settings['lorebook']>) => {
      await updateSettings({
        lorebook: {
          ...lorebookSettings,
          ...lorebook,
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lorebookSettings],
  )
}

export function useCharacterSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.character, []),
  })
  return data
}

export function useUpdateCharacterSettings() {
  const characterSettings = useCharacterSettings()
  const updateSettings = useUpdateSettingsMutation()

  return useCallback(
    async (character: Partial<Settings['character']>) => {
      await updateSettings({
        character: {
          ...characterSettings,
          ...character,
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterSettings],
  )
}

export function usePersonaSettings() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery({
    ...trpc.settings.get.queryOptions(),
    select: useCallback(({ settings }: { settings: Settings }) => settings.persona, []),
  })
  return data
}

export function useUpdatePersonaSettings() {
  const personaSettings = usePersonaSettings()
  const updateSettings = useUpdateSettingsMutation()

  return useCallback(
    async (persona: Partial<Settings['persona']>) => {
      await updateSettings({
        persona: {
          ...personaSettings,
          ...persona,
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [personaSettings],
  )
}
