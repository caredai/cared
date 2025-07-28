import type { AppRouter } from '@tavern/api'
import type { PersonaMetadata } from '@tavern/core'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import pDebounce from 'p-debounce'
import { toast } from 'sonner'
import hash from 'stable-hash'

import { useActiveChat } from '@/hooks/use-chat'
import { usePersonaSettings } from '@/hooks/use-settings'
import { debounceTimeout } from '@/lib/debounce'
import { useTRPC } from '@/trpc/client'

type RouterOutput = inferRouterOutputs<AppRouter>
export type Persona = RouterOutput['persona']['get']['persona']

export function useActivePersona() {
  const { personas } = usePersonas()
  const { active: activePersonaId } = usePersonaSettings()

  const activePersona = useMemo(() => {
    if (!activePersonaId) {
      return
    }
    return personas.find((p) => p.id === activePersonaId)
  }, [personas, activePersonaId])

  return {
    activePersona,
  }
}

export function usePersonaByActiveChat(): {
  persona?: Persona
  linkedPersonas?: Persona[]
  characterId?: string
  groupId?: string
} {
  const { personas } = usePersonas()
  const {
    active: activePersonaId,
    default: defaultPersonaId,
    autoLockToChat,
  } = usePersonaSettings()
  const { activeChat } = useActiveChat()

  const linkPersona = useLinkPersona()

  useEffect(() => {
    if (!activePersonaId || !activeChat || !autoLockToChat) {
      return
    }
    if (
      personas
        .find((persona) => persona.id === activePersonaId)
        ?.chats.find((chatId) => chatId === activeChat.id)
    ) {
      return
    }

    void linkPersona(activePersonaId, {
      chatId: activeChat.id,
    })
  }, [activeChat, activePersonaId, autoLockToChat, linkPersona, personas])

  return useMemo(() => {
    if (!activeChat) {
      return {}
    }

    // 1. Find persona linked to this chat
    const chatLinkedPersona = personas.find((persona) => persona.chats.includes(activeChat.id))
    if (chatLinkedPersona) {
      return {
        persona: chatLinkedPersona,
      }
    }

    // 2. Find persona linked to chat's character or group
    const characterOrGroupId = activeChat.characterId || activeChat.groupId
    if (characterOrGroupId) {
      const linkedPersonas = personas.filter(
        (persona) =>
          persona.characters.includes(characterOrGroupId) ||
          persona.groups.includes(characterOrGroupId),
      )

      if (linkedPersonas.length > 0) {
        return {
          persona: linkedPersonas[0], // Use first one if multiple found
          linkedPersonas: linkedPersonas.length > 1 ? linkedPersonas : undefined,
          characterId: activeChat.characterId,
          groupId: activeChat.groupId,
        }
      }
    }

    // 3. Use default persona from settings
    if (defaultPersonaId) {
      const defaultPersona = personas.find((persona) => persona.id === defaultPersonaId)
      if (defaultPersona) {
        return {
          persona: defaultPersona,
        }
      }
    }

    // 4. Return empty
    return {}
  }, [activeChat, personas, defaultPersonaId])
}

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

export function useImportPersonas() {
  const trpc = useTRPC()
  const { refetchPersonas } = usePersonas()

  const batchCreatePersonasMutation = useMutation(
    trpc.persona.batchCreate.mutationOptions({
      onSuccess: () => {
        void refetchPersonas()
      },
      onError: (error) => {
        toast.error(`Failed to import personas: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (personas: { name: string; metadata: Omit<PersonaMetadata, 'imageUrl'> }[]) => {
      return await batchCreatePersonasMutation.mutateAsync({
        personas,
      })
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

export function useLinkPersona() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const personaSettings = usePersonaSettings()

  // Link to character mutation
  const linkToCharacterMutation = useMutation(
    trpc.persona.linkToCharacter.mutationOptions({
      onMutate: async ({ personaId, characterId }) => {
        await queryClient.cancelQueries({
          queryKey: trpc.persona.list.queryKey(),
        })

        const previousData = queryClient.getQueryData(trpc.persona.list.queryKey())

        // Optimistically update the persona list
        queryClient.setQueryData(trpc.persona.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }

          // Check if multi-connections are allowed
          const allowMulti = personaSettings.allowMultiConnectionsPerCharacter

          const updatedPersonas = old.personas.map((persona) => {
            if (persona.id === personaId) {
              // Avoid duplicate
              if (persona.characters.includes(characterId)) return persona
              return {
                ...persona,
                characters: [...persona.characters, characterId],
              }
            }
            // If multi-connections not allowed, remove from other personas
            if (!allowMulti) {
              return {
                ...persona,
                characters: persona.characters.filter((id) => id !== characterId),
              }
            }
            return persona
          })

          return {
            personas: updatedPersonas,
          }
        })

        return { previousData }
      },
      onError: (error, variables, context) => {
        if (context) {
          queryClient.setQueryData(trpc.persona.list.queryKey(), context.previousData)
        }
        console.error('Failed to link persona to character:', error)
        // toast.error(`Failed to link persona to character: ${error.message}`)
      },
    }),
  )

  // Link to group mutation
  const linkToGroupMutation = useMutation(
    trpc.persona.linkToGroup.mutationOptions({
      onMutate: async ({ personaId, groupId }) => {
        await queryClient.cancelQueries({
          queryKey: trpc.persona.list.queryKey(),
        })

        const previousData = queryClient.getQueryData(trpc.persona.list.queryKey())

        // Optimistically update the persona list
        queryClient.setQueryData(trpc.persona.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }

          // Check if multi-connections are allowed
          const allowMulti = personaSettings.allowMultiConnectionsPerCharacter

          const updatedPersonas = old.personas.map((persona) => {
            if (persona.id === personaId) {
              // Avoid duplicate
              if (persona.groups.includes(groupId)) return persona
              return {
                ...persona,
                groups: [...persona.groups, groupId],
              }
            }
            // If multi-connections not allowed, remove from other personas
            if (!allowMulti) {
              return {
                ...persona,
                groups: persona.groups.filter((id) => id !== groupId),
              }
            }
            return persona
          })

          return {
            personas: updatedPersonas,
          }
        })

        return { previousData }
      },
      onError: (error, variables, context) => {
        if (context) {
          queryClient.setQueryData(trpc.persona.list.queryKey(), context.previousData)
        }
        console.error('Failed to link persona to group:', error)
        // toast.error(`Failed to link persona to group: ${error.message}`)
      },
    }),
  )

  // Link to chat mutation
  const linkToChatMutation = useMutation(
    trpc.persona.linkToChat.mutationOptions({
      onMutate: async ({ personaId, chatId }) => {
        await queryClient.cancelQueries({
          queryKey: trpc.persona.list.queryKey(),
        })

        const previousData = queryClient.getQueryData(trpc.persona.list.queryKey())

        // Optimistically update the persona
        queryClient.setQueryData(trpc.persona.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }

          // First, remove the chat from all other personas
          const updatedPersonas = old.personas.map((persona) => ({
            ...persona,
            chats: persona.chats.filter((id) => id !== chatId),
          }))

          // Then, add the chat to the target persona
          const targetIndex = updatedPersonas.findIndex((persona) => persona.id === personaId)
          if (targetIndex === -1) {
            return old
          }

          const targetPersona = updatedPersonas[targetIndex]!
          updatedPersonas[targetIndex] = {
            ...targetPersona,
            chats: [...targetPersona.chats, chatId],
          }

          return {
            personas: updatedPersonas,
          }
        })

        return { previousData }
      },
      onError: (error, variables, context) => {
        if (context) {
          queryClient.setQueryData(trpc.persona.list.queryKey(), context.previousData)
        }
        console.error('Failed to link persona to chat:', error)
        // toast.error(`Failed to link persona to chat: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (
      personaId: string,
      {
        characterId,
        groupId,
        chatId,
      }: {
        characterId?: string
        groupId?: string
        chatId?: string
      },
    ) => {
      if (characterId) {
        return await linkToCharacterMutation.mutateAsync({
          personaId,
          characterId,
        })
      }

      if (groupId) {
        return await linkToGroupMutation.mutateAsync({
          personaId,
          groupId,
        })
      }

      if (chatId) {
        return await linkToChatMutation.mutateAsync({
          personaId,
          chatId,
        })
      }

      throw new Error('No valid link target provided')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function useUnlinkPersona() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Unlink from character mutation
  const unlinkFromCharacterMutation = useMutation(
    trpc.persona.unlinkFromCharacter.mutationOptions({
      onMutate: async ({ personaId, characterId }) => {
        await queryClient.cancelQueries({
          queryKey: trpc.persona.list.queryKey(),
        })

        const previousData = queryClient.getQueryData(trpc.persona.list.queryKey())

        // Optimistically update the persona
        queryClient.setQueryData(trpc.persona.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const index = old.personas.findIndex((persona) => persona.id === personaId)
          if (index === -1) {
            return old
          }
          const persona = old.personas[index]!
          return {
            personas: [
              ...old.personas.slice(0, index),
              {
                ...persona,
                characters: persona.characters.filter((id) => id !== characterId),
              },
              ...old.personas.slice(index + 1),
            ],
          }
        })

        return { previousData }
      },
      onError: (error, variables, context) => {
        if (context) {
          queryClient.setQueryData(trpc.persona.list.queryKey(), context.previousData)
        }
        console.error('Failed to unlink persona from character:', error)
        // toast.error(`Failed to unlink persona from character: ${error.message}`)
      },
    }),
  )

  // Unlink from group mutation
  const unlinkFromGroupMutation = useMutation(
    trpc.persona.unlinkFromGroup.mutationOptions({
      onMutate: async ({ personaId, groupId }) => {
        await queryClient.cancelQueries({
          queryKey: trpc.persona.list.queryKey(),
        })

        const previousData = queryClient.getQueryData(trpc.persona.list.queryKey())

        // Optimistically update the persona
        queryClient.setQueryData(trpc.persona.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const index = old.personas.findIndex((persona) => persona.id === personaId)
          if (index === -1) {
            return old
          }
          const persona = old.personas[index]!
          return {
            personas: [
              ...old.personas.slice(0, index),
              {
                ...persona,
                groups: persona.groups.filter((id) => id !== groupId),
              },
              ...old.personas.slice(index + 1),
            ],
          }
        })

        return { previousData }
      },
      onError: (error, variables, context) => {
        if (context) {
          queryClient.setQueryData(trpc.persona.list.queryKey(), context.previousData)
        }
        console.error('Failed to unlink persona from group:', error)
        // toast.error(`Failed to unlink persona from group: ${error.message}`)
      },
    }),
  )

  // Unlink from chat mutation
  const unlinkFromChatMutation = useMutation(
    trpc.persona.unlinkFromChat.mutationOptions({
      onMutate: async ({ personaId, chatId }) => {
        await queryClient.cancelQueries({
          queryKey: trpc.persona.list.queryKey(),
        })

        const previousData = queryClient.getQueryData(trpc.persona.list.queryKey())

        // Optimistically update the persona
        queryClient.setQueryData(trpc.persona.list.queryKey(), (old) => {
          if (!old) {
            return undefined
          }
          const index = old.personas.findIndex((persona) => persona.id === personaId)
          if (index === -1) {
            return old
          }
          const persona = old.personas[index]!
          return {
            personas: [
              ...old.personas.slice(0, index),
              {
                ...persona,
                chats: persona.chats.filter((id) => id !== chatId),
              },
              ...old.personas.slice(index + 1),
            ],
          }
        })

        return { previousData }
      },
      onError: (error, variables, context) => {
        if (context) {
          queryClient.setQueryData(trpc.persona.list.queryKey(), context.previousData)
        }
        console.error('Failed to unlink persona from chat:', error)
        // toast.error(`Failed to unlink persona from chat: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (
      personaId: string,
      {
        characterId,
        groupId,
        chatId,
      }: {
        characterId?: string
        groupId?: string
        chatId?: string
      },
    ) => {
      if (characterId) {
        return await unlinkFromCharacterMutation.mutateAsync({
          personaId,
          characterId,
        })
      }

      if (groupId) {
        return await unlinkFromGroupMutation.mutateAsync({
          personaId,
          groupId,
        })
      }

      if (chatId) {
        return await unlinkFromChatMutation.mutateAsync({
          personaId,
          chatId,
        })
      }

      throw new Error('No valid unlink target provided')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

export function usePersonasByCharacterOrGroup(charOrGroupId?: string) {
  const { personas } = usePersonas()

  const linkedPersonas = useMemo(() => {
    if (!charOrGroupId) {
      return []
    }
    return personas.filter(
      (persona) =>
        persona.characters.includes(charOrGroupId) || persona.groups.includes(charOrGroupId),
    )
  }, [personas, charOrGroupId])

  return {
    linkedPersonas,
  }
}
