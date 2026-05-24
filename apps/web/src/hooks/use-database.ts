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

function invalidateEndpointQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  namespaceId: string,
  branchId?: string,
) {
  invalidateNamespaceQueries(queryClient, namespaceId)
  if (branchId) {
    void queryClient.invalidateQueries({
      queryKey: orpc.account.database.listBranchEndpoints.queryOptions({
        input: { namespaceId, branchId },
      }).queryKey,
    })
  } else {
    void queryClient.invalidateQueries({
      queryKey: orpc.account.database.listBranchEndpoints.key(),
    })
  }
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
 * List connection URIs for databases on a branch.
 */
export function useDatabaseBranchConnectionUris(namespaceId: string, branchId: string) {
  const {
    data: { connectionUris },
  } = useSuspenseQuery(
    orpc.account.database.listConnectionUris.queryOptions({
      input: { namespaceId, branchId },
    }),
  )

  return connectionUris
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

export function useCreateDatabaseBranchRole(namespaceId: string, branchId: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.database.createRole.mutationOptions({
      onSuccess: () => {
        invalidateBranchQueries(queryClient, namespaceId, branchId)
        toast.success('Role created')
      },
      onError: (error) => {
        console.error('Failed to create role:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create role')
      },
    }),
  )

  return {
    createDatabaseBranchRole: (
      input: Omit<RouterInputs['account']['database']['createRole'], 'namespaceId' | 'branchId'>,
    ) => createMutation.mutateAsync({ namespaceId, branchId, ...input }),
    isCreating: createMutation.isPending,
  }
}

export function useDatabaseBranchRoleAction(namespaceId: string, branchId: string) {
  const queryClient = useQueryClient()

  const resetMutation = useMutation(
    orpc.account.database.resetRolePassword.mutationOptions({
      onSuccess: () => {
        invalidateBranchQueries(queryClient, namespaceId, branchId)
        toast.success('Role password reset')
      },
      onError: (error) => {
        console.error('Failed to reset role password:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to reset role password')
      },
    }),
  )

  const passwordMutation = useMutation(orpc.account.database.getRolePassword.mutationOptions())

  const deleteMutation = useMutation(
    orpc.account.database.deleteRole.mutationOptions({
      onSuccess: () => {
        invalidateBranchQueries(queryClient, namespaceId, branchId)
        toast.success('Role deleted')
      },
      onError: (error) => {
        console.error('Failed to delete role:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete role')
      },
    }),
  )

  return {
    getRolePassword: (roleName: string) =>
      passwordMutation.mutateAsync({ namespaceId, branchId, roleName }),
    resetRolePassword: (roleName: string) =>
      resetMutation.mutateAsync({ namespaceId, branchId, roleName }),
    deleteRole: (roleName: string) =>
      deleteMutation.mutateAsync({ namespaceId, branchId, roleName }),
    isPending: resetMutation.isPending || passwordMutation.isPending || deleteMutation.isPending,
  }
}

export function useCreateDatabaseBranchDatabase(namespaceId: string, branchId: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.database.createDatabase.mutationOptions({
      onSuccess: () => {
        invalidateBranchQueries(queryClient, namespaceId, branchId)
        toast.success('Database created')
      },
      onError: (error) => {
        console.error('Failed to create database:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create database')
      },
    }),
  )

  return {
    createDatabaseBranchDatabase: (
      input: Omit<
        RouterInputs['account']['database']['createDatabase'],
        'namespaceId' | 'branchId'
      >,
    ) => createMutation.mutateAsync({ namespaceId, branchId, ...input }),
    isCreating: createMutation.isPending,
  }
}

export function useDeleteDatabaseBranchDatabase(namespaceId: string, branchId: string) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    orpc.account.database.deleteDatabase.mutationOptions({
      onSuccess: () => {
        invalidateBranchQueries(queryClient, namespaceId, branchId)
        toast.success('Database deleted')
      },
      onError: (error) => {
        console.error('Failed to delete database:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete database')
      },
    }),
  )

  return {
    deleteDatabaseBranchDatabase: (databaseName: string) =>
      deleteMutation.mutateAsync({ namespaceId, branchId, databaseName }),
    isDeleting: deleteMutation.isPending,
  }
}

/**
 * Create a compute endpoint in a database namespace.
 */
export function useCreateDatabaseEndpoint(namespaceId: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    orpc.account.database.createEndpoint.mutationOptions({
      onSuccess: (data) => {
        invalidateEndpointQueries(queryClient, namespaceId, data.endpoint.branchId)
        toast.success('Compute endpoint created')
      },
      onError: (error) => {
        console.error('Failed to create compute endpoint:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create compute endpoint')
      },
    }),
  )

  const createDatabaseEndpoint = useCallback(
    async (input: RouterInputs['account']['database']['createEndpoint']) => {
      return await createMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespaceId],
  )

  return {
    createDatabaseEndpoint,
    isCreating: createMutation.isPending,
  }
}

/**
 * Update compute endpoint settings.
 */
export function useUpdateDatabaseEndpoint(namespaceId: string) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    orpc.account.database.updateEndpoint.mutationOptions({
      onSuccess: (data) => {
        invalidateEndpointQueries(queryClient, namespaceId, data.endpoint.branchId)
        toast.success('Compute endpoint updated')
      },
      onError: (error) => {
        console.error('Failed to update compute endpoint:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update compute endpoint')
      },
    }),
  )

  const updateDatabaseEndpoint = useCallback(
    async (input: RouterInputs['account']['database']['updateEndpoint']) => {
      return await updateMutation.mutateAsync(input)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespaceId],
  )

  return {
    updateDatabaseEndpoint,
    isUpdating: updateMutation.isPending,
  }
}

/**
 * Run a lifecycle action on a compute endpoint.
 */
export function useDatabaseEndpointAction(namespaceId: string) {
  const queryClient = useQueryClient()

  const invalidateFromResult = (data: { endpoint: DatabaseEndpoint }) => {
    invalidateEndpointQueries(queryClient, namespaceId, data.endpoint.branchId)
  }

  const startMutation = useMutation(
    orpc.account.database.startEndpoint.mutationOptions({
      onSuccess: (data) => {
        invalidateFromResult(data)
        toast.success('Compute endpoint started')
      },
      onError: (error) => {
        console.error('Failed to start compute endpoint:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to start compute endpoint')
      },
    }),
  )

  const suspendMutation = useMutation(
    orpc.account.database.suspendEndpoint.mutationOptions({
      onSuccess: (data) => {
        invalidateFromResult(data)
        toast.success('Compute endpoint suspended')
      },
      onError: (error) => {
        console.error('Failed to suspend compute endpoint:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to suspend compute endpoint')
      },
    }),
  )

  const restartMutation = useMutation(
    orpc.account.database.restartEndpoint.mutationOptions({
      onSuccess: (data) => {
        invalidateFromResult(data)
        toast.success('Compute endpoint restarted')
      },
      onError: (error) => {
        console.error('Failed to restart compute endpoint:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to restart compute endpoint')
      },
    }),
  )

  const deleteMutation = useMutation(
    orpc.account.database.deleteEndpoint.mutationOptions({
      onSuccess: (data) => {
        invalidateFromResult(data)
        toast.success('Compute endpoint deleted')
      },
      onError: (error) => {
        console.error('Failed to delete compute endpoint:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to delete compute endpoint')
      },
    }),
  )

  return {
    startDatabaseEndpoint: (endpointId: string) =>
      startMutation.mutateAsync({ namespaceId, endpointId }),
    suspendDatabaseEndpoint: (endpointId: string) =>
      suspendMutation.mutateAsync({ namespaceId, endpointId }),
    restartDatabaseEndpoint: (endpointId: string) =>
      restartMutation.mutateAsync({ namespaceId, endpointId }),
    deleteDatabaseEndpoint: (endpointId: string) =>
      deleteMutation.mutateAsync({ namespaceId, endpointId }),
    isPending:
      startMutation.isPending ||
      suspendMutation.isPending ||
      restartMutation.isPending ||
      deleteMutation.isPending,
  }
}
