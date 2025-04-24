import type { AppRouter } from '@tavern/api'
import type { CharacterCardV2 } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useEffect } from 'react'
import { CCardLib } from '@risuai/ccardlib'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { pngRead, pngWrite } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import { useAsync } from 'react-use'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type Character = RouterOutput['character']['get']['character']

const charactersAtom = atom<
  Record<
    string,
    {
      character: CharacterCardV2
      blob: Uint8Array
    }
  >
>({})

export function useUpdateCharacter(char: Character) {
  const trpc = useTRPC()

  const updateMutation = useMutation(
    trpc.character.update.mutationOptions({
      // TODO
      onError: (error) => {
        toast.error(`Failed to update character: ${error.message}`)
      },
    }),
  )

  const [characters, setCharacters] = useAtom(charactersAtom)

  return useCallback(
    async (character: CharacterCardV2) => {
      const data = characters[char.id]
      if (!data) {
        return
      }

      const blob = pngWrite(data.blob, JSON.stringify(character))

      const formData = new FormData()
      formData.set('id', char.id)
      formData.set('blob', new Blob([blob]))
      await updateMutation.mutateAsync(formData)

      setCharacters({
        ...characters,
        [char.id]: {
          character,
          blob,
        },
      })
    },
    [updateMutation, char.id, characters, setCharacters],
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

export function useCharacters() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery(trpc.character.list.queryOptions())

  const [, setCharacters] = useAtom(charactersAtom)

  useEffect(() => {
    setCharacters((chars) => {
      const ids = new Set(data.characters.map((c) => c.id))
      const newChars = {} as typeof chars
      for (const [id, char] of Object.entries(chars)) {
        if (ids.has(id)) {
          newChars[id] = char
        }
      }
      if (hash(newChars) === hash(chars)) {
        return chars
      }
      return newChars
    })
  }, [data, setCharacters])

  return {
    characters: data.characters,
    refetchCharacters: refetch,
  }
}

export function useCharacter(char: Character) {
  const [characters, setCharacters] = useAtom(charactersAtom)

  return useAsync(async () => {
    const c = characters[char.id]
    if (c) {
      return c
    }

    const blob = await (await (await fetch(char.metadata.url)).blob()).bytes()
    const ch = JSON.parse(pngRead(blob))

    const charV2 = CCardLib.character.convert(ch, {
      to: 'v2',
    })

    setCharacters({
      ...characters,
      [char.id]: {
        character: charV2,
        blob,
      },
    })

    return charV2
  }, [char, characters])
}
