import type { AppRouter } from '@tavern/api'
import type { CharacterCardV2 } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback } from 'react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { importFile, importUrl } from '@tavern/core'
import { toast } from 'sonner'

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

function useCreateCharacter() {
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

export function useImportCharactersFromFiles() {
  const createMutation = useCreateCharacter()

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
        formData.set('filename', result.filename)

        await createMutation.mutateAsync(formData)
      }
    },
    [createMutation],
  )
}

export function useImportCharactersFromUrls() {
  const createMutation = useCreateCharacter()

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
        let blob, filename
        try {
          const result = await importUrl(url)
          if (
            typeof result !== 'string' &&
            result.type === 'character' &&
            result.mimeType === 'image/png'
          ) {
            blob = new Blob([result.bytes])
            filename = result.filename
          }
        } catch {
          // If local importing failed, import url again at server side
        }

        // Create form data and submit
        const formData = new FormData()
        formData.set('source', 'import-url')
        formData.set('fromUrl', url)
        if (blob && filename) {
          formData.set('blob', blob)
          formData.set('filename', filename)
        }

        await createMutation.mutateAsync(formData)
      }
    },
    [createMutation],
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
    [updateMutation, char.id],
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
    [deleteMutation],
  )
}
