import { useCallback } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { orpc } from '@/lib/orpc'
import type { RouterOutputs } from '@cared/api'

export type McpServer = RouterOutputs['account']['mcp']['list']['mcpServers'][number]

/**
 * Hook to fetch all MCP servers for the current account.
 * @returns MCP servers array
 */
export function useMcpServers() {
  const {
    data: { mcpServers },
  } = useSuspenseQuery(orpc.account.mcp.list.queryOptions())

  return mcpServers
}

/**
 * Hook to fetch a single MCP server by ID.
 * @param id - MCP server ID
 * @returns MCP server details
 */
export function useMcpServer(id: string) {
  const {
    data: { mcpServer },
  } = useSuspenseQuery(
    orpc.account.mcp.get.queryOptions({
      input: {
        id,
      },
    }),
  )

  return mcpServer
}

/**
 * Hook to create a new MCP server.
 * @returns Function to create an MCP server
 */
export function useCreateMcpServer() {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.mcp.create.mutationOptions({
      onSuccess: () => {
        // Invalidate MCP servers list to refresh the UI
        void queryClient.invalidateQueries({
          queryKey: orpc.account.mcp.list.queryOptions().queryKey,
        })
        toast.success('MCP server created successfully')
      },
      onError: (error) => {
        console.error('Failed to create MCP server:', error)
        toast.error(`Failed to create MCP server: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { name: string; configuration: { toolkits?: string[]; tools?: string[] } }) => {
      return await createMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to update an existing MCP server.
 * @returns Function to update an MCP server
 */
export function useUpdateMcpServer() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.mcp.update.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate MCP servers list and the specific server to refresh the UI
        void queryClient.invalidateQueries({
          queryKey: orpc.account.mcp.list.queryOptions().queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.account.mcp.get.queryOptions({ input: { id: variables.id } }).queryKey,
        })
        toast.success('MCP server updated successfully')
      },
      onError: (error) => {
        console.error('Failed to update MCP server:', error)
        toast.error(`Failed to update MCP server: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: {
      id: string
      name?: string
      configuration?: { toolkits?: string[]; tools?: string[] }
    }) => {
      return await updateMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

/**
 * Hook to delete an MCP server.
 * @returns Function to delete an MCP server
 */
export function useDeleteMcpServer() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.mcp.delete.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate MCP servers list and the specific server to refresh the UI
        void queryClient.invalidateQueries({
          queryKey: orpc.account.mcp.list.queryOptions().queryKey,
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.account.mcp.get.queryOptions({ input: { id: variables.id } }).queryKey,
        })
        toast.success('MCP server deleted successfully')
      },
      onError: (error) => {
        console.error('Failed to delete MCP server:', error)
        toast.error(`Failed to delete MCP server: ${error.message}`)
      },
    }),
  )

  return useCallback(
    async (input: { id: string }) => {
      await deleteMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}

