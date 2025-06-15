import type { AppRouter } from '@tavern/api'
import type { PersonaMetadata } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { debounceTimeout } from '@/lib/debounce'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type Persona = RouterOutput['persona']['get']['persona']

export function usePersonas() {
  const trpc = useTRPC()

  const {
    data: { personas },
    refetch,
  } = useSuspenseQuery({
    ...trpc.persona.list.queryOptions(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    personas,
    refetchPersonas: refetch,
  }
}

export function usePersona(id?: string) {
  const { personas } = usePersonas()

  return useMemo(() => {
    return personas.find((p) => p.id === id)
  }, [personas, id])
}

export function useCreatePersona() {
  const trpc = useTRPC()
  const { refetchPersonas } = usePersonas()

  const createPersonaMutation = useMutation(
    trpc.persona.create.mutationOptions({
      onSuccess: () => {
        void refetchPersonas()
      },
      onError: (error) => {
        toast.error(`Failed to create persona: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { name: string; metadata: PersonaMetadata }) => {
      return await createPersonaMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useUpdatePersona() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.persona.update.mutationOptions({
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: trpc.persona.list.queryKey(),
      })

      const previousData = queryClient.getQueryData(trpc.persona.list.queryKey())

      // Optimistically update the persona
      queryClient.setQueryData(trpc.persona.list.queryKey(), (old) => {
        if (!old) {
          return undefined
        }
        const index = old.personas.findIndex((persona) => persona.id === newData.id)
        const persona = old.personas[index]!
        return {
          personas: [
            ...old.personas.slice(0, index),
            {
              ...persona,
              name: newData.name ?? persona.name,
              metadata: {
                ...persona.metadata,
                ...newData.metadata,
              },
            },
            ...old.personas.slice(index + 1),
          ],
        }
      })

      return { previousData }
    },
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(trpc.persona.list.queryKey(), context.previousData)
      }
      console.error('Failed to update persona:', error)
      toast.error(`Failed to update persona: ${error.message}`)
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

  const { personas } = usePersonas()

  return useCallback(
    async (
      id: string,
      {
        name,
        metadata,
      }: {
        name?: string
        metadata?: Partial<PersonaMetadata>
      },
    ) => {
      const persona = personas.find((persona) => persona.id === id)
      if (!persona) {
        return
      }

      if (
        (!name || name === persona.name) &&
        (!metadata ||
          hash({
            ...persona.metadata,
            ...metadata,
          }) === hash(persona.metadata))
      ) {
        // No changes to apply
        return
      }

      return await mutation.mutateAsync({
        id,
        name,
        metadata,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [personas],
  )
}

export function useDeletePersona() {
  const trpc = useTRPC()
  const { refetchPersonas } = usePersonas()

  const deletePersonaMutation = useMutation(
    trpc.persona.delete.mutationOptions({
      onSuccess: () => {
        void refetchPersonas()
      },
      onError: (error) => {
        toast.error(`Failed to delete persona: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (id: string) => {
      await deletePersonaMutation.mutateAsync({
        id,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useDeletePersonas() {
  const trpc = useTRPC()
  const { refetchPersonas } = usePersonas()

  const deletePersonasMutation = useMutation(
    trpc.persona.batchDelete.mutationOptions({
      onSuccess: () => {
        void refetchPersonas()
      },
      onError: (error) => {
        toast.error(`Failed to delete personas: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (ids: string[]) => {
      await deletePersonasMutation.mutateAsync({
        ids,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
