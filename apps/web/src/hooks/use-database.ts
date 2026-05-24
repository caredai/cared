import { useCallback, useMemo } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RouterInputs, RouterOutputs } from '@cared/api'
import type {
  Database,
  DatabaseBranch,
  DatabaseEndpoint,
  DatabaseNamespace,
  DatabaseRole,
} from '@cared/api/types'
import { getDatabaseNamespaceUsageLimits } from '@cared/api/types'

import { orpc } from '@/lib/orpc'

export type { Database, DatabaseBranch, DatabaseEndpoint, DatabaseNamespace, DatabaseRole }

const DEFAULT_BRANCH_LIMIT = 100

function invalidateBranchQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  namespaceId: string,
  branchId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.getBranch.queryOptions({
      input: { namespaceId, branchId },
    }).queryKey,
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.listBranchEndpoints.queryOptions({
      input: { namespaceId, branchId },
    }).queryKey,
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.listRoles.queryOptions({
      input: { namespaceId, branchId },
    }).queryKey,
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.listDatabases.queryOptions({
      input: { namespaceId, branchId },
    }).queryKey,
  })
  invalidateNamespaceQueries(queryClient, namespaceId)
}

function invalidateNamespaceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  namespaceId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.getNamespace.queryOptions({ input: { id: namespaceId } })
      .queryKey,
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.listBranches.key(),
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.listEndpoints.queryOptions({ input: { namespaceId } }).queryKey,
  })
  void queryClient.invalidateQueries({
    queryKey: orpc.account.database.countBranches.queryOptions({ input: { namespaceId } }).queryKey,
  })
}

export type ListBranchesInput = RouterInputs['account']['database']['listBranches']

/**
 * Fetch all database namespaces for the current account.
 */
export function useDatabaseNamespaces() {
  const {
    data: { namespaces },
  } = useSuspenseQuery(orpc.account.database.listNamespaces.queryOptions())

  return namespaces
}

/**
 * Fetch a single database namespace by id.
 */
export function useDatabaseNamespace(id: string) {
  const {
    data: { namespace },
  } = useSuspenseQuery(
    orpc.account.database.getNamespace.queryOptions({
      input: { id },
    }),
  )

  return namespace
}

/**
 * List branches for a database namespace.
 */
export function useDatabaseBranches(namespaceId: string, input?: ListBranchesInput) {
  const {
    data: { branches },
  } = useSuspenseQuery(
    orpc.account.database.listBranches.queryOptions({
      input: {
        namespaceId,
        limit: input?.limit ?? DEFAULT_BRANCH_LIMIT,
        search: input?.search,
        cursor: input?.cursor,
      },
    }),
  )

  return branches
}

/**
 * List compute endpoints for a database namespace.
 */
export function useDatabaseEndpoints(namespaceId: string) {
  const {
    data: { endpoints },
  } = useSuspenseQuery(
    orpc.account.database.listEndpoints.queryOptions({
      input: { namespaceId },
    }),
  )

  return endpoints
}

/**
 * Branch count for a database namespace.
 */
export function useDatabaseBranchCount(namespaceId: string) {
  const {
    data: { count },
  } = useSuspenseQuery(
    orpc.account.database.countBranches.queryOptions({
      input: { namespaceId },
    }),
  )

  return count
}

/**
 * Fetch a single branch by id.
 */
export function useDatabaseBranch(namespaceId: string, branchId: string) {
  const {
    data: { branch },
  } = useSuspenseQuery(
    orpc.account.database.getBranch.queryOptions({
      input: { namespaceId, branchId },
    }),
  )

  return branch
}

/**
 * List compute endpoints for a branch.
 */
export function useDatabaseBranchEndpoints(namespaceId: string, branchId: string) {
  const {
    data: { endpoints },
  } = useSuspenseQuery(
    orpc.account.database.listBranchEndpoints.queryOptions({
      input: { namespaceId, branchId },
    }),
  )

  return endpoints
}

/**
 * List Postgres roles for a branch.
 */
export function useDatabaseBranchRoles(namespaceId: string, branchId: string) {
  const {
    data: { roles },
  } = useSuspenseQuery(
    orpc.account.database.listRoles.queryOptions({
      input: { namespaceId, branchId },
    }),
  )

  return roles
}

/**
 * List Postgres databases for a branch.
 */
export function useDatabaseBranchDatabases(namespaceId: string, branchId: string) {
  const {
    data: { databases },
  } = useSuspenseQuery(
    orpc.account.database.listDatabases.queryOptions({
      input: { namespaceId, branchId },
    }),
  )

  return databases
}

/**
 * Update a branch (name, protected flag).
 */
export function useUpdateDatabaseBranch(namespaceId: string) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.database.updateBranch.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateBranchQueries(queryClient, namespaceId, variables.branchId)
        toast.success('Branch updated')
      },
      onError: (error) => {
        console.error('Failed to update branch:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update branch')
      },
    }),
  )

  const updateDatabaseBranch = useCallback(
    async (input: RouterInputs['account']['database']['updateBranch']) => {
      return await updateMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespaceId],
  )

  return {
    updateDatabaseBranch,
    isUpdating: updateMutation.isPending,
  }
}

/**
 * Usage limits derived from namespace tier and quota settings.
 */
export function useNamespaceUsageLimits(
  namespace: RouterOutputs['account']['database']['getNamespace']['namespace'],
) {
  return useMemo(
    () => getDatabaseNamespaceUsageLimits(namespace.isLowCost, namespace.settings?.quota),
    [namespace.isLowCost, namespace.settings?.quota],
  )
}

/**
 * Create a database namespace. Invalidates the namespace list on success.
 */
export function useCreateDatabaseNamespace() {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.database.createNamespace.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.database.listNamespaces.queryOptions().queryKey,
        })
        toast.success('Database namespace created')
      },
      onError: (error) => {
        console.error('Failed to create database namespace:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create database namespace')
      },
    }),
  )

  const createDatabaseNamespace = useCallback(
    async (input: RouterInputs['account']['database']['createNamespace']) => {
      return await createMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return {
    createDatabaseNamespace,
    isCreating: createMutation.isPending,
  }
}

/**
 * Delete a database namespace by id. Invalidates the namespace list on success.
 */
export function useDeleteDatabaseNamespace() {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.database.deleteNamespace.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.account.database.listNamespaces.queryOptions().queryKey,
        })
        toast.success('Database namespace deleted')
      },
      onError: (error) => {
        console.error('Failed to delete database namespace:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete database namespace')
      },
    }),
  )

  const deleteDatabaseNamespace = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync({ id })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return {
    deleteDatabaseNamespace,
    isDeleting: deleteMutation.isPending,
  }
}

/**
 * Update a database namespace. Invalidates namespace queries on success.
 */
export function useUpdateDatabaseNamespace(namespaceId: string) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.database.updateNamespace.mutationOptions({
      onSuccess: () => {
        invalidateNamespaceQueries(queryClient, namespaceId)
        void queryClient.invalidateQueries({
          queryKey: orpc.account.database.listNamespaces.queryOptions().queryKey,
        })
        toast.success('Namespace updated')
      },
      onError: (error) => {
        console.error('Failed to update database namespace:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update database namespace')
      },
    }),
  )

  const updateDatabaseNamespace = useCallback(
    async (input: Omit<RouterInputs['account']['database']['updateNamespace'], 'id'>) => {
      return await updateMutation.mutateAsync({ id: namespaceId, ...input })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespaceId],
  )

  return {
    updateDatabaseNamespace,
    isUpdating: updateMutation.isPending,
  }
}

/**
 * Create a branch in a database namespace.
 */
export function useCreateDatabaseBranch(namespaceId: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.database.createBranch.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateNamespaceQueries(queryClient, namespaceId)
        if (variables.parentId) {
          invalidateBranchQueries(queryClient, namespaceId, variables.parentId)
        }
        toast.success('Branch created')
      },
      onError: (error) => {
        console.error('Failed to create branch:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create branch')
      },
    }),
  )

  const createDatabaseBranch = useCallback(
    async (input: RouterInputs['account']['database']['createBranch']) => {
      return await createMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespaceId],
  )

  return {
    createDatabaseBranch,
    isCreating: createMutation.isPending,
  }
}

/**
 * Delete a branch from a database namespace.
 */
export function useDeleteDatabaseBranch(namespaceId: string) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.database.deleteBranch.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateNamespaceQueries(queryClient, namespaceId)
        invalidateBranchQueries(queryClient, namespaceId, variables.branchId)
        toast.success('Branch deleted')
      },
      onError: (error) => {
        console.error('Failed to delete branch:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete branch')
      },
    }),
  )

  const deleteDatabaseBranch = useCallback(
    async (branchId: string) => {
      await deleteMutation.mutateAsync({ namespaceId, branchId })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespaceId],
  )

  return {
    deleteDatabaseBranch,
    isDeleting: deleteMutation.isPending,
  }
}
