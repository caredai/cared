import type { AppRouter } from '@tavern/api'
import type { LorebookEntry } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { debounceTimeout } from '@/lib/debounce'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type Lorebook = RouterOutput['lorebook']['get']['lorebook']

export function useLorebooks() {
  const trpc = useTRPC()

  const { data, refetch } = useSuspenseQuery({
    ...trpc.lorebook.list.queryOptions({
      includeEntries: true,
    }),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return {
    lorebooks: data.lorebooks as Lorebook[],
    refetchLorebooks: refetch,
  }
}

export function useLorebook(id?: string) {
  const { lorebooks } = useLorebooks()

  const lorebook = useMemo(() => {
    return lorebooks.find((lorebook) => lorebook.id === id)
  }, [lorebooks, id])

  return {
    lorebook: lorebook,
  }
}

export function useCreateLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    trpc.lorebook.create.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        })

        const previousData = queryClient.getQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        )

        // Optimistically add the new lorebook
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
            if (!old) {
              return undefined
            }
            const newLorebook = {
              id: 'temp-id',
              name: newData.name,
              description: newData.description ?? null,
              entries: newData.entries ?? [],
              metadata: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              chatIds: [],
              characterIds: [],
              primaryCharacterIds: [],
              groupIds: [],
              personaIds: [],
            }
            return {
              lorebooks: [newLorebook, ...old.lorebooks],
            }
          },
        )

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(
            trpc.lorebook.list.queryKey({
              includeEntries: true,
            }),
            context.previousData,
          )
        }
        console.error('Failed to create lorebook:', error)
        toast.error(`Failed to create lorebook: ${error.message}`)
      },
      onSuccess: (data) => {
        // Update the temporary lorebook with the real one
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
            if (!old) {
              return undefined
            }
            const index = old.lorebooks.findIndex((lorebook) => lorebook.id === 'temp-id')
            return {
              lorebooks: [
                ...old.lorebooks.slice(0, index),
                data.lorebook,
                ...old.lorebooks.slice(index + 1),
              ],
            }
          },
        )
      },
    }),
  )

  return useCallback(async (name: string, description?: string, entries?: LorebookEntry[]) => {
    return await createMutation.mutateAsync({
      name,
      description,
      entries,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useUpdateLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const mutationOptions = trpc.lorebook.update.mutationOptions({
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: trpc.lorebook.list.queryKey({
          includeEntries: true,
        }),
      })

      const previousData = queryClient.getQueryData(
        trpc.lorebook.list.queryKey({
          includeEntries: true,
        }),
      )

      queryClient.setQueryData(
        trpc.lorebook.list.queryKey({
          includeEntries: true,
        }),
        (old) => {
          if (!old) {
            return undefined
          }
          const index = old.lorebooks.findIndex((lorebook) => lorebook.id === newData.id)
          const lorebook = old.lorebooks[index]! as Lorebook
          return {
            lorebooks: [
              ...old.lorebooks.slice(0, index),
              {
                ...lorebook,
                ...newData,
              },
              ...old.lorebooks.slice(index + 1),
            ],
          }
        },
      )

      return { previousData }
    },
    onError: (error, newData, context) => {
      if (context) {
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          context.previousData,
        )
      }
      console.error('Failed to update lorebook:', error)
      toast.error(`Failed to update lorebook: ${error.message}`)
    },
  })

  const mutationFnRef = useRef(mutationOptions.mutationFn)
  mutationFnRef.current = mutationOptions.mutationFn

  // @ts-ignore
  const mutationFn = useCallback((...args: any[]) => mutationFnRef.current?.(...args), [])

  mutationOptions.mutationFn = useMemo(
    () => pDebounce(mutationFn, debounceTimeout.extended),
    [mutationFn],
  )

  const mutation = useMutation(mutationOptions)

  const { lorebooks } = useLorebooks()

  return useCallback(
    async (args: { id: string; name?: string; entries?: LorebookEntry[] }) => {
      const lorebook = lorebooks.find((lorebook) => lorebook.id === args.id)
      if (!lorebook) {
        return
      }

      if (
        !(args.name && args.name !== lorebook.name) &&
        !(args.entries && hash(args.entries) !== hash(lorebook.entries))
      ) {
        // No changes to apply
        return
      }

      return await mutation.mutateAsync(structuredClone(args))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lorebooks],
  )
}

export function useDeleteLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.lorebook.delete.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        })

        const previousData = queryClient.getQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        )

        // Optimistically remove the lorebook
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
            if (!old) {
              return undefined
            }
            return {
              lorebooks: old.lorebooks.filter((lorebook) => lorebook.id !== newData.id),
            }
          },
        )

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(
            trpc.lorebook.list.queryKey({
              includeEntries: true,
            }),
            context.previousData,
          )
        }
        console.error('Failed to delete lorebook:', error)
        toast.error(`Failed to delete lorebook: ${error.message}`)
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

export function useLinkLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const linkMutation = useMutation(
    trpc.lorebook.link.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        })

        const previousData = queryClient.getQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        )

        // Optimistically update the lorebook with new links
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
            if (!old) {
              return undefined
            }

            const index = old.lorebooks.findIndex((lorebook) => lorebook.id === newData.lorebookId)
            if (index === -1) {
              return old
            }

            let lorebooks = [...old.lorebooks]
            const updatedLorebook = { ...lorebooks[index]! }

            if (newData.chatId && !updatedLorebook.chatIds.includes(newData.chatId)) {
              lorebooks = lorebooks.map((lorebook) => ({
                ...lorebook,
                chatIds: lorebook.chatIds.filter((id) => id !== newData.chatId),
              }))

              updatedLorebook.chatIds = [...updatedLorebook.chatIds, newData.chatId]
            }
            if (
              newData.characterId &&
              !updatedLorebook.characterIds.includes(newData.characterId)
            ) {
              updatedLorebook.characterIds = [...updatedLorebook.characterIds, newData.characterId]
            }
            if (
              newData.primaryCharacterId &&
              !updatedLorebook.primaryCharacterIds.includes(newData.primaryCharacterId)
            ) {
              lorebooks = lorebooks.map((lorebook) => ({
                ...lorebook,
                characterIds: lorebook.primaryCharacterIds.find(
                  (id) => id === newData.primaryCharacterId,
                )
                  ? lorebook.characterIds.filter((id) => id !== newData.primaryCharacterId)
                  : lorebook.characterIds,
                primaryCharacterIds: lorebook.primaryCharacterIds.filter(
                  (id) => id !== newData.primaryCharacterId,
                ),
              }))

              if (!updatedLorebook.characterIds.includes(newData.primaryCharacterId)) {
                updatedLorebook.characterIds = [
                  ...updatedLorebook.characterIds,
                  newData.primaryCharacterId,
                ]
              }

              updatedLorebook.primaryCharacterIds = [
                ...updatedLorebook.primaryCharacterIds,
                newData.primaryCharacterId,
              ]
            }
            if (newData.groupId && !updatedLorebook.groupIds.includes(newData.groupId)) {
              updatedLorebook.groupIds = [...updatedLorebook.groupIds, newData.groupId]
            }
            if (newData.personaId && !updatedLorebook.personaIds.includes(newData.personaId)) {
              lorebooks = lorebooks.map((lorebook) => ({
                ...lorebook,
                personaIds: lorebook.personaIds.filter((id) => id !== newData.personaId),
              }))

              updatedLorebook.personaIds = [...updatedLorebook.personaIds, newData.personaId]
            }

            return {
              lorebooks: [
                ...lorebooks.slice(0, index),
                updatedLorebook,
                ...lorebooks.slice(index + 1),
              ],
            }
          },
        )

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(
            trpc.lorebook.list.queryKey({
              includeEntries: true,
            }),
            context.previousData,
          )
        }
        console.error('Failed to link lorebook:', error)
        toast.error(`Failed to link lorebook: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (args: {
      lorebookId: string
      chatId?: string
      characterId?: string
      primaryCharacterId?: string
      groupId?: string
      personaId?: string
    }) => {
      return await linkMutation.mutateAsync(args)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useUnlinkLorebook() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const unlinkMutation = useMutation(
    trpc.lorebook.unlink.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        })

        const previousData = queryClient.getQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
        )

        // Optimistically update the lorebook by removing links
        queryClient.setQueryData(
          trpc.lorebook.list.queryKey({
            includeEntries: true,
          }),
          (old) => {
            if (!old) {
              return undefined
            }
            const index = old.lorebooks.findIndex((lorebook) => lorebook.id === newData.lorebookId)
            if (index === -1) {
              return old
            }

            const lorebook = old.lorebooks[index]!
            const updatedLorebook = { ...lorebook }

            // Remove links optimistically
            if (newData.chatId) {
              updatedLorebook.chatIds = updatedLorebook.chatIds.filter(
                (id) => id !== newData.chatId,
              )
            }
            if (newData.characterId) {
              updatedLorebook.characterIds = updatedLorebook.characterIds.filter(
                (id) => id !== newData.characterId,
              )
            }
            if (newData.groupId) {
              updatedLorebook.groupIds = updatedLorebook.groupIds.filter(
                (id) => id !== newData.groupId,
              )
            }
            if (newData.personaId) {
              updatedLorebook.personaIds = updatedLorebook.personaIds.filter(
                (id) => id !== newData.personaId,
              )
            }

            return {
              lorebooks: [
                ...old.lorebooks.slice(0, index),
                updatedLorebook,
                ...old.lorebooks.slice(index + 1),
              ],
            }
          },
        )

        return { previousData }
      },
      onError: (error, newData, context) => {
        if (context) {
          queryClient.setQueryData(
            trpc.lorebook.list.queryKey({
              includeEntries: true,
            }),
            context.previousData,
          )
        }
        console.error('Failed to unlink lorebook:', error)
        toast.error(`Failed to unlink lorebook: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (args: {
      lorebookId: string
      chatId?: string
      characterId?: string
      groupId?: string
      personaId?: string
    }) => {
      return await unlinkMutation.mutateAsync(args)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useLorebooksByChat(chatId?: string) {
  const { lorebooks } = useLorebooks()

  const filteredLorebooks = useMemo(() => {
    if (!chatId) {
      return []
    }
    return lorebooks.filter((lorebook) => lorebook.chatIds.includes(chatId))
  }, [lorebooks, chatId])

  return {
    lorebooks: filteredLorebooks,
  }
}

export function useLorebooksByCharacter(characterId?: string) {
  const { lorebooks } = useLorebooks()

  const filteredLorebooks = useMemo(() => {
    if (!characterId) {
      return []
    }
    return lorebooks.filter((lorebook) => lorebook.characterIds.includes(characterId))
  }, [lorebooks, characterId])

  return {
    lorebooks: filteredLorebooks,
  }
}

export function useLorebooksByCharacterGroup(groupId?: string) {
  const { lorebooks } = useLorebooks()

  const filteredLorebooks = useMemo(() => {
    if (!groupId) {
      return []
    }
    return lorebooks.filter((lorebook) => lorebook.groupIds.includes(groupId))
  }, [lorebooks, groupId])

  return {
    lorebooks: filteredLorebooks,
  }
}

export function useLorebooksByCharacterOrGroup(charOrGroupId?: string) {
  const { lorebooks } = useLorebooks()

  const filteredLorebooks = useMemo(() => {
    if (!charOrGroupId) {
      return []
    }
    return lorebooks.filter(
      (lorebook) =>
        lorebook.characterIds.includes(charOrGroupId) || lorebook.groupIds.includes(charOrGroupId),
    )
  }, [lorebooks, charOrGroupId])

  return {
    lorebooks: filteredLorebooks,
  }
}

export function useLorebooksByPersona(personaId?: string) {
  const { lorebooks } = useLorebooks()

  const filteredLorebooks = useMemo(() => {
    if (!personaId) {
      return []
    }
    return lorebooks.filter((lorebook) => lorebook.personaIds.includes(personaId))
  }, [lorebooks, personaId])

  return {
    lorebooks: filteredLorebooks,
  }
}

export function useActiveLorebooks(
  chatId?: string,
  charOrGroupId?: string,
  personaId?: string,
  global?: string[],
) {
  const { lorebooks } = useLorebooks()

  const filteredLorebooks = useMemo(() => {
    return lorebooks.filter(
      (lorebook) =>
        (chatId && lorebook.chatIds.includes(chatId)) ||
        (charOrGroupId &&
          (lorebook.characterIds.includes(charOrGroupId) ||
            lorebook.groupIds.includes(charOrGroupId))) ||
        (personaId && lorebook.personaIds.includes(personaId)) ||
        global?.includes(lorebook.id),
    )
  }, [lorebooks, chatId, charOrGroupId, personaId, global])

  return {
    lorebooks: filteredLorebooks,
  }
}
