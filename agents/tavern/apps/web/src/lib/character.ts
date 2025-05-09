import type { AppRouter } from '@tavern/api'
import type { CharacterCardV2 } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { characterCardV2Schema, importFile, importUrl, pngWrite } from '@tavern/core'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { debounceTimeout } from '@/lib/debounce'
import defaultPng from '@/public/images/ai4.png'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type Character = RouterOutput['character']['get']['character']

export function useCharacters() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.character.list.queryOptions(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    characters: data.characters,
    refetchCharacters: refetch,
  }
}

export function useCharacter(id?: string) {
  const { characters } = useCharacters()
  return useMemo(() => {
    return characters.find((char) => char.id === id)
  }, [characters, id])
}

function useCreateCharacterMutation() {
  const trpc = useTRPC()
  const { refetchCharacters } = useCharacters()

  return useMutation(
    trpc.character.create.mutationOptions({
      onSuccess: () => {
        void refetchCharacters()
      },
      onError: (error) => {
        toast.error(`Failed to create character: ${error.message}`)
      },
    }),
  )
}

export function useCreateCharacter() {
  const createMutation = useCreateCharacterMutation()

  return useCallback(
    async (content: CharacterCardV2, imageDataUrl?: string) => {
      const pngBytes = imageDataUrl
        ? await fetch(imageDataUrl).then((r) => r.bytes())
        : await (await fetch(defaultPng.src)).bytes()

      const bytes = pngWrite(pngBytes, JSON.stringify(content))

      // Create form data and submit
      const formData = new FormData()
      formData.set('source', 'create')
      formData.set('blob', new Blob([bytes]))

      await createMutation.mutateAsync(formData)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useImportCharactersFromFiles() {
  const createMutation = useCreateCharacterMutation()

  return useCallback(
    async (files: FileList | null) => {
      if (!files?.length) {
        toast.error('No file selected')
        return
      }

      const defaultPngBytes = await (await fetch(defaultPng.src)).bytes()

      for (const file of files) {
        // Check file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        if (!fileExtension || !['png', 'json', 'charx'].includes(fileExtension)) {
          toast.error('Unsupported file type. Please select .png, .json, or .charx files')
          return
        }

        const result = await importFile(file, defaultPngBytes).catch((error) => {
          toast.error(`Unable to import character file: ${error.message}`)
          throw error
        })

        if (typeof result !== 'object') {
          toast.error(`Unable to parse character file: ${result}`)
          return
        }

        // Create form data and submit
        const formData = new FormData()
        formData.set('source', 'import-file')
        formData.set('blob', new Blob([result.bytes]))

        await createMutation.mutateAsync(formData)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useImportCharactersFromUrls() {
  const createMutation = useCreateCharacterMutation()

  return useCallback(
    async (str: string) => {
      const urls = str
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      if (!urls.length) {
        toast.error('No URL input')
        return
      }

      for (const url of urls) {
        // Always import url locally first
        let blob
        try {
          const result = await importUrl(url)
          if (
            typeof result !== 'string' &&
            result.type === 'character' &&
            result.mimeType === 'image/png'
          ) {
            blob = new Blob([result.bytes])
          }
        } catch {
          // If local importing failed, import url again at server side
        }

        // Create form data and submit
        const formData = new FormData()
        formData.set('source', 'import-url')
        formData.set('fromUrl', url)
        if (blob) {
          formData.set('blob', blob)
        }

        await createMutation.mutateAsync(formData)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useUpdateCharacter(char: Character) {
  const { refetchCharacters } = useCharacters()

  const trpc = useTRPC()

  const updateMutation = useMutation(
    trpc.character.update.mutationOptions({
      onSuccess: () => {
        void refetchCharacters()
      },
      onError: (error) => {
        toast.error(`Failed to update character: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (character: CharacterCardV2) => {
      const formData = new FormData()
      formData.set('id', char.id)
      formData.set('content', JSON.stringify(character))
      await updateMutation.mutateAsync(formData)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [char.id],
  )
}

export function useUpdateCharacterDebounce() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.character.update.mutationOptions({
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: trpc.character.list.queryKey() })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(trpc.character.list.queryKey())

      // Optimistically update to the new value
      queryClient.setQueryData(trpc.character.list.queryKey(), (old) => {
        if (!old) {
          return undefined
        }
        const id = newData.get('id') as string
        const content: CharacterCardV2 = JSON.parse(newData.get('content') as string)
        const index = old.characters.findIndex((char) => char.id === id)
        return {
          characters: [
            ...old.characters.slice(0, index),
            {
              ...old.characters.at(index)!,
              content,
            },
            ...old.characters.slice(index + 1),
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
        queryClient.setQueryData(trpc.character.list.queryKey(), context.previousData)
      }
      console.error('Failed to update character:', error)
      toast.error(`Failed to update character: ${error.message}`)
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
        queryClient.setQueryData(trpc.character.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const index = old.characters.findIndex((char) => char.id === data.character.id)
          return {
            characters: [
              ...old.characters.slice(0, index),
              data.character,
              ...old.characters.slice(index + 1),
            ],
          }
        })
      },
    })

  return useCallback(
    async (character: Character, content: CharacterCardV2) => {
      // Strip out any unnecessary properties
      content = characterCardV2Schema.parse(content)
      // Check if the content is the same as the current one
      if (hash(content) === hash(character.content)) {
        return
      }
      const formData = new FormData()
      formData.set('id', character.id)
      formData.set('content', JSON.stringify(content))
      await mutation.mutateAsync(formData)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useUpdateCharacterImage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    trpc.character.update.mutationOptions({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey: trpc.character.list.queryKey() })

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(trpc.character.list.queryKey())

        // Optimistically update to the new value
        queryClient.setQueryData(trpc.character.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const id = newData.get('id') as string
          const url = newData.get('url') as string
          const index = old.characters.findIndex((char) => char.id === id)
          const char = old.characters.at(index)!
          return {
            characters: [
              ...old.characters.slice(0, index),
              {
                ...char,
                metadata: {
                  ...char.metadata,
                  url,
                },
              },
              ...old.characters.slice(index + 1),
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
          queryClient.setQueryData(trpc.character.list.queryKey(), context.previousData)
        }
        console.error('Failed to update character:', error)
        toast.error(`Failed to update character: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (char: Character, imageDataUrl: string) => {
      const pngBytes = await fetch(imageDataUrl).then((r) => r.bytes())
      const bytes = pngWrite(pngBytes, JSON.stringify(char.content))

      const formData = new FormData()
      formData.set('id', char.id)
      formData.set('blob', new Blob([bytes]))
      // Not used by server side, only for optimistic update at client side
      formData.set('url', imageDataUrl)
      await updateMutation.mutateAsync(formData, {
        onSuccess: (data) => {
          // Will execute only once, for the last mutation
          queryClient.setQueryData(trpc.character.list.queryKey(), (old) => {
            if (!old) {
              return undefined
            }
            const index = old.characters.findIndex((char) => char.id === data.character.id)
            return {
              characters: [
                ...old.characters.slice(0, index),
                data.character,
                ...old.characters.slice(index + 1),
              ],
            }
          })
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char.id])
}

export function useDeleteCharacters() {
  const trpc = useTRPC()

  const { refetchCharacters } = useCharacters()

  const deleteMutation = useMutation(
    trpc.character.batchDelete.mutationOptions({
      onSuccess: () => {
        void refetchCharacters()
      },
      onError: (error) => {
        toast.error(`Failed to delete characters: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (ids: string[]) => {
      await deleteMutation.mutateAsync({
        ids,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
