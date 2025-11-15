import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { orpc } from '@/lib/orpc'

/**
 * Hook to fetch all toolkit categories.
 * @returns Categories array with id and name
 */
export function useCategories() {
  const {
    data: { categories },
  } = useSuspenseQuery(orpc.account.tool.listCategories.queryOptions())

  return categories
}

/**
 * Hook to fetch all toolkits.
 * @returns Toolkits array
 */
export function useToolkits() {
  const {
    data: { toolkits },
  } = useSuspenseQuery(orpc.account.tool.listToolkits.queryOptions())

  return toolkits
}

/**
 * Hook to fetch tools with optional filters.
 * At least one of toolkits, tools, or search must be provided.
 * @param input - Filters: toolkits, tools, scopes, tags, search, limit
 * @returns Tools array
 */
export function useTools(input: {
  toolkits?: string[]
  tools?: string[]
  scopes?: string[]
  tags?: string[]
  search?: string
  limit?: number
}) {
  const {
    data: { tools },
  } = useSuspenseQuery(
    orpc.account.tool.listTools.queryOptions({
      input,
    }),
  )

  return tools
}

/**
 * Hook to fetch connections for a toolkit.
 * @param toolkit - Toolkit slug
 * @param type - Type of identifier ('user' or 'account')
 * @returns Connections array
 */
export function useConnections(toolkit: string, type: 'user' | 'account' = 'user') {
  const { data: {connections} } = useSuspenseQuery(
    orpc.account.tool.listConnections.queryOptions({
      input: {
        toolkits: [toolkit],
        type,
      },
    }),
  )

  return connections
}

/**
 * Hook to fetch a single connection by ID.
 * @param id - Connection ID
 * @param type - Type of identifier ('user' or 'account')
 * @returns Connection details
 */
export function useConnection(id: string, type: 'user' | 'account' = 'user') {
  const {
    data: { connection },
  } = useSuspenseQuery(
    orpc.account.tool.getConnection.queryOptions({
      input: {
        id,
        type,
      },
    }),
  )

  return connection
}

/**
 * Hook to fetch a single tool by slug.
 * @param slug - Tool slug
 * @returns Tool details
 */
export function useTool(slug: string) {
  const {
    data: { tool },
  } = useSuspenseQuery(
    orpc.account.tool.getTool.queryOptions({
      input: {
        slug,
      },
    }),
  )

  return tool
}

/**
 * Hook to create a new connection for a toolkit.
 * @returns Function to create a connection
 */
export function useCreateConnection() {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.tool.createConnection.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate connections list to refresh the UI
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.queryOptions({
            input: {
              toolkits: [variables.toolkit],
              type: variables.type,
            },
          }).queryKey,
        })
      },
      onError: (error) => {
        console.error('Failed to create connection:', error)
        toast.error(`Failed to create connection: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { toolkit: string; type?: 'user' | 'account' }) => {
      return await createMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to delete a connection.
 * @returns Function to delete a connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.tool.deleteConnection.mutationOptions({
      onSuccess: () => {
        // Invalidate all connections queries
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.queryOptions({
            input: { toolkits: [], type: 'user' },
          }).queryKey.slice(0, -1), // Remove the input part to invalidate all variants
        })
        toast.success('Connection deleted successfully')
      },
      onError: (error) => {
        console.error('Failed to delete connection:', error)
        toast.error(`Failed to delete connection: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { id: string; type?: 'user' | 'account' }) => {
      await deleteMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to update a connection's enabled status.
 * @returns Function to update a connection
 */
export function useUpdateConnection() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.tool.updateConnection.mutationOptions({
      onSuccess: () => {
        // Invalidate all connections queries
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.queryOptions({
            input: { toolkits: [], type: 'user' },
          }).queryKey.slice(0, -1), // Remove the input part to invalidate all variants
        })
        toast.success('Connection updated successfully')
      },
      onError: (error) => {
        console.error('Failed to update connection:', error)
        toast.error(`Failed to update connection: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { id: string; enabled: boolean; type?: 'user' | 'account' }) => {
      await updateMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to refresh a connection.
 * @returns Function to refresh a connection
 */
export function useRefreshConnection() {
  const queryClient = useQueryClient()

  const refreshMutation = useMutation(
    orpc.account.tool.refreshConnection.mutationOptions({
      onSuccess: () => {
        // Invalidate all connections queries
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.queryOptions({
            input: { toolkits: [], type: 'user' },
          }).queryKey.slice(0, -1), // Remove the input part to invalidate all variants
        })
      },
      onError: (error) => {
        console.error('Failed to refresh connection:', error)
        toast.error(`Failed to refresh connection: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { id: string; type?: 'user' | 'account' }) => {
      return await refreshMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
