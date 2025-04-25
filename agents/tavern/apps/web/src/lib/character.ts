import type { DefaultError } from '@tanstack/react-query'
import type { AppRouter } from '@tavern/api'
import type { CharacterCardV2 } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback } from 'react'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import { CCardLib } from '@risuai/ccardlib'
import {
  replaceEqualDeep,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { pngRead, pngWrite } from '@tavern/core'
import isEqual from 'lodash/isEqual'
import { toast } from 'sonner'

import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type Character = RouterOutput['character']['get']['character']

export function useCharacters() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery(trpc.character.list.queryOptions())

  return {
    characters: data.characters,
    refetchCharacters: refetch,
  }
}

interface CharacterData {
  character: CharacterCardV2
  blob: Uint8Array
}

export const characterQueries = createQueryKeys('characters', {
  data: (url: string) => ({
    queryKey: [url],
  }),
})

export function useCharacterCard(char: Character) {
  return useQuery<CharacterData, DefaultError, CharacterData | undefined>({
    queryKey: characterQueries.data(char.metadata.url).queryKey,
    queryFn: async () => {
      const blob = await (await (await fetch(char.metadata.url)).blob()).bytes()
      const c = JSON.parse(pngRead(blob))

      const charV2 = CCardLib.character.convert(c, {
        to: 'v2',
      })

      return {
        character: charV2,
        blob,
      } as CharacterData
    },
    // @ts-ignore
    structuralSharing: (
      oldData: CharacterData | undefined,
      newData: CharacterData | undefined,
    ): CharacterData | undefined => {
      if (!oldData || !newData) {
        return newData
      }
      const isBlobEqual = isEqual(oldData.blob, newData.blob)
      const character = replaceEqualDeep(oldData.character, newData.character)
      if (isBlobEqual && character === oldData.character) {
        return oldData
      }
      return {
        character,
        blob: isBlobEqual ? oldData.blob : newData.blob,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateCharacterCard(char: Character) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.character.update.mutationOptions({
      onMutate: async (newData) => {
        const queryKey = characterQueries.data(char.metadata.url).queryKey

        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey })

        // Snapshot the previous value
        const previousData: CharacterData | undefined = queryClient.getQueryData(queryKey)

        // Optimistically update to the new value
        queryClient.setQueryData(
          queryKey,
          async (old: CharacterData | undefined): Promise<CharacterData | undefined> =>
            old && {
              ...old,
              blob: await (newData.get('blob') as Blob).bytes(),
            },
        )

        // Return a context object with the snapshotted value
        return { previousData }
      },
      // If the mutation fails,
      // use the context returned from onMutate to roll back
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(
            characterQueries.data(char.metadata.url).queryKey,
            context.previousData,
          )
        }
        toast.error(`Failed to update character: ${error.message}`)
      },
    }),
  )

  const { data } = useCharacterCard(char)

  return useCallback(
    async (character: CharacterCardV2) => {
      if (!data) {
        return
      }

      const blob = pngWrite(data.blob, JSON.stringify(character))

      const formData = new FormData()
      formData.set('id', char.id)
      formData.set('blob', new Blob([blob]))
      await updateMutation.mutateAsync(formData)
    },
    [updateMutation, char.id, data],
  )
}

export function useDeleteCharacter(char: Character) {
  const trpc = useTRPC()

  const { refetchCharacters } = useCharacters()

  const deleteMutation = useMutation(
    trpc.character.delete.mutationOptions({
      onSuccess: () => {
        void refetchCharacters()
      },
      onError: (error) => {
        toast.error(`Failed to delete character: ${error.message}`)
      },
    }),
  )

  return useCallback(async () => {
    await deleteMutation.mutateAsync({
      id: char.id,
    })
  }, [deleteMutation, char.id])
}
