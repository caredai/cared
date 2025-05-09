import type { AppRouter } from '@tavern/api'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo } from 'react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Character } from './character'
import { useTRPC } from '@/trpc/client'
import { useCharacters } from './character'

type RouterOutput = inferRouterOutputs<AppRouter>
export type CharacterGroup = Omit<RouterOutput['characterGroup']['get']['group'], 'characters'> & {
  characters: Character[]
  missingCharacters: string[]
}

export function isCharacterGroup(char: Character | CharacterGroup): char is CharacterGroup {
  return 'characters' in char
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
    async (characters: Character[], name?: string) => {
      await createGroupMutation.mutateAsync({
        characters: characters.map((c) => c.id),
        metadata: {
          name:
            name ??
            (characters[0]!.content.data.name
              ? `Group: ${characters[0]!.content.data.name}`
              : 'Group'),
        },
      })
    },
    [createGroupMutation],
  )
}

export function useUpdateCharacterGroup() {
  const trpc = useTRPC()
  const { refetchGroups } = useCharacterGroups()

  const updateGroupMutation = useMutation(
    trpc.characterGroup.update.mutationOptions({
      onSuccess: () => {
        void refetchGroups()
      },
      onError: (error) => {
        toast.error(`Failed to update character group: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string, characters?: string[], name?: string) => {
      await updateGroupMutation.mutateAsync({
        id,
        characters,
        ...(name && {
          metadata: {
            name,
          },
        }),
      })
    },
    [updateGroupMutation],
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
