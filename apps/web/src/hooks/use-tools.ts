import { useCallback, useEffect, useMemo } from 'react'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { atom, useAtom } from 'jotai'
import { toast } from 'sonner'

import type { RouterOutputs } from '@cared/api'

import { orpc } from '@/lib/orpc'

const DEFAULT_PAGE_SIZE = 1000

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

export type Connection = RouterOutputs['account']['tool']['listConnections']['connections'][number]

const hasAttemptedFetchConnectionsAtom = atom(false)

/**
 * Hook to fetch all connections for toolkits using infinite query.
 * Automatically fetches all pages to ensure complete data.
 * @param toolkits - Toolkit slugs to filter
 * @param type - Type of identifier ('user' or 'account')
 * @returns Connections array and pagination controls
 */
export function useConnections(toolkits: string[], type: 'user' | 'account' = 'user') {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery(
    orpc.account.tool.listConnections.infiniteOptions({
      input: (cursor?: string) => ({
        toolkits,
        type,
        cursor,
        limit: DEFAULT_PAGE_SIZE,
      }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => {
        if (!lastPage.hasMore) return undefined
        return lastPage.cursor
      },
      placeholderData: keepPreviousData,
    }),
  )

  const [hasAttemptedFetch, setHasAttemptedFetch] = useAtom(hasAttemptedFetchConnectionsAtom)

  // Automatically fetch all pages
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !hasAttemptedFetch) {
      console.log('Fetching connections...')
      setHasAttemptedFetch(true)
      void fetchNextPage().finally(() => setHasAttemptedFetch(false))
    }
  }, [fetchNextPage, hasAttemptedFetch, hasNextPage, isFetchingNextPage, setHasAttemptedFetch])

  // Flatten all pages into a single array
  const connections = useMemo(() => {
    return data?.pages.flatMap((page) => page.connections) ?? []
  }, [data])

  return {
    connections,
    refetchConnections: refetch,
  }
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
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.key(),
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
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.key(),
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.getConnection.key(),
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
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.key(),
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.getConnection.key(),
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
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.listConnections.key(),
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.account.tool.getConnection.key(),
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
