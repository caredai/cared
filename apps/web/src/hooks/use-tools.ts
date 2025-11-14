import { useSuspenseQuery } from '@tanstack/react-query'

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
