import type { AppRouter } from '@tavern/api'
import type { CharGroupMetadata } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

import type { Character } from './use-character'
import { debounceTimeout } from '@/lib/debounce'
import { useTRPC } from '@/trpc/client'
import { useCharacters } from './use-character'

type RouterOutput = inferRouterOutputs<AppRouter>
export type CharacterGroup = Omit<RouterOutput['characterGroup']['get']['group'], 'characters'> & {
  characters: Character[]
  missingCharacters: string[]
}

export function useCharacterGroups() {
  const { characters } = useCharacters()

  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.characterGroup.list.queryOptions(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const groups: CharacterGroup[] = useMemo(() => {
    const charMap = new Map(characters.map((c) => [c.id, c]))

    return data.groups.map((group) => {
      const characters = [],
        missingCharacters = []
      for (const charId of group.characters) {
        const character = charMap.get(charId)
        if (character) {
          characters.push(character)
        } else {
          missingCharacters.push(charId)
        }
      }
      return {
        ...group,
        characters,
        missingCharacters,
      }
    })
  }, [characters, data.groups])

  return {
    groups,
    refetchGroups: refetch,
  }
}

export function useCharacterGroup(id?: string) {
  const { groups } = useCharacterGroups()

  return useMemo(() => {
    return groups.find((g) => g.id === id)
  }, [groups, id])
}

export function useCreateCharacterGroup() {
  const trpc = useTRPC()
  const { refetchGroups } = useCharacterGroups()

  const createGroupMutation = useMutation(
    trpc.characterGroup.create.mutationOptions({
      onSuccess: () => {
        void refetchGroups()
      },
      onError: (error) => {
        toast.error(`Failed to create character group: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (characters: Character[], metadata: CharGroupMetadata) => {
      await createGroupMutation.mutateAsync({
        characters: characters.map((c) => c.id),
        metadata,
      })
    },
    [createGroupMutation],
  )
}

export function useUpdateCharacterGroup() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.characterGroup.update.mutationOptions({
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: trpc.characterGroup.list.queryKey(),
      })

      const previousData = queryClient.getQueryData(trpc.characterGroup.list.queryKey())

      // Optimistically update the group
      queryClient.setQueryData(trpc.characterGroup.list.queryKey(), (old) => {
        if (!old) {
          return undefined
        }
        const index = old.groups.findIndex((group) => group.id === newData.id)
        const group = old.groups[index]!
        return {
          groups: [
            ...old.groups.slice(0, index),
            {
              ...group,
              ...newData,
              metadata: {
                ...group.metadata,
                ...newData.metadata,
              },
            },
            ...old.groups.slice(index + 1),
          ],
        }
      })

      return { previousData }
    },
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(trpc.characterGroup.list.queryKey(), context.previousData)
      }
      console.error('Failed to update character group:', error)
      toast.error(`Failed to update character group: ${error.message}`)
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

  const { groups } = useCharacterGroups()

  return useCallback(
    async (id: string, characters?: string[], metadata?: Partial<CharGroupMetadata>) => {
      const group = groups.find((group) => group.id === id)
      if (!group) {
        return
      }

      if (
        !(characters && hash(characters) !== hash(group.characters.map((c) => c.id))) &&
        !(
          metadata &&
          hash({
            ...group.metadata,
            ...metadata,
          }) !== hash(group.metadata)
        )
      ) {
        // No changes to apply
        return
      }

      return await mutation.mutateAsync({
        id,
        characters,
        metadata,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups],
  )
}

export function useDeleteCharacterGroup() {
  const trpc = useTRPC()
  const { refetchGroups } = useCharacterGroups()

  const deleteGroupMutation = useMutation(
    trpc.characterGroup.delete.mutationOptions({
      onSuccess: () => {
        void refetchGroups()
      },
      onError: (error) => {
        toast.error(`Failed to delete character group: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string) => {
      await deleteGroupMutation.mutateAsync({
        id,
      })
    },
    [deleteGroupMutation],
  )
}

export function useDeleteCharacterGroups() {
  const trpc = useTRPC()
  const { refetchGroups } = useCharacterGroups()

  const deleteGroupsMutation = useMutation(
    trpc.characterGroup.batchDelete.mutationOptions({
      onSuccess: () => {
        void refetchGroups()
      },
      onError: (error) => {
        toast.error(`Failed to delete character groups: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (ids: string[]) => {
      await deleteGroupsMutation.mutateAsync({
        ids,
      })
    },
    [deleteGroupsMutation],
  )
}
