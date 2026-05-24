import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { RouterInputs, RouterOutputs } from '@cared/api'

import { orpc } from '@/lib/orpc'

// ---------------------------------------------------------------------------
// Types from API (RouterOutputs)
// ---------------------------------------------------------------------------

export type SandboxItem = RouterOutputs['account']['sandbox']['listSandboxes']['sandboxes'][number]
export type SnapshotItem = RouterOutputs['account']['sandbox']['listSnapshots']['snapshots'][number]
export type RegistryItem =
  RouterOutputs['account']['sandbox']['listRegistries']['registries'][number]
export type VolumeItem = RouterOutputs['account']['sandbox']['listVolumes']['volumes'][number]

// ---------------------------------------------------------------------------
// Query keys for invalidation
// ---------------------------------------------------------------------------

function sandboxQueryKeys() {
  return {
    sandboxes: orpc.account.sandbox.listSandboxes.key(),
    regions: orpc.account.sandbox.listRegions.key(),
    snapshots: orpc.account.sandbox.listSnapshots.key(),
    volumes: orpc.account.sandbox.listVolumes.key(),
    registries: orpc.account.sandbox.listRegistries.key(),
  }
}

export function useListRegions() {
  return useQuery(orpc.account.sandbox.listRegions.queryOptions())
}

// ---------------------------------------------------------------------------
// Sandboxes
// ---------------------------------------------------------------------------

const DEFAULT_SANDBOX_LIMIT = 20

export type ListSandboxesInput = RouterInputs['account']['sandbox']['listSandboxes']

export function useListSandboxes(input?: ListSandboxesInput) {
  const query = useInfiniteQuery({
    ...orpc.account.sandbox.listSandboxes.infiniteOptions({
      input: (cursor?: string) => ({
        ...(input ?? {}),
        limit: input?.limit ?? DEFAULT_SANDBOX_LIMIT,
        cursor,
      }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
      placeholderData: keepPreviousData,
    }),
    // Refetch every 5 seconds to keep sandbox states up to date
    refetchInterval: 5000,
  })
  const sandboxes = query.data?.pages.flatMap((p) => p.sandboxes) ?? []
  return {
    ...query,
    sandboxes,
    hasMore: query.data?.pages[query.data.pages.length - 1]?.hasMore ?? false,
  }
}

export function useGetSandbox(idOrName: string | undefined) {
  return useQuery({
    ...orpc.account.sandbox.getSandbox.queryOptions({
      input: { idOrName: idOrName ?? '' },
    }),
    enabled: !!idOrName,
  })
}

export function useCreateSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.createSandbox.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().sandboxes })
      },
    }),
  })
}

export function useDeleteSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.deleteSandbox.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().sandboxes })
      },
    }),
  })
}

export function useStartSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.startSandbox.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().sandboxes })
      },
    }),
  })
}

export function useStopSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.stopSandbox.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().sandboxes })
      },
    }),
  })
}

export function useArchiveSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.archiveSandbox.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().sandboxes })
      },
    }),
  })
}

export function useRecoverSandbox() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.recoverSandbox.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().sandboxes })
      },
    }),
  })
}

export function useCreateSandboxSshAccess() {
  return useMutation(orpc.account.sandbox.createSandboxSshAccess.mutationOptions())
}

export function useRevokeSandboxSshAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.revokeSandboxSshAccess.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().sandboxes })
      },
    }),
  })
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

const DEFAULT_SNAPSHOT_LIMIT = 20

export type ListSnapshotsInput = RouterInputs['account']['sandbox']['listSnapshots']

export function useListSnapshots(input?: ListSnapshotsInput) {
  const query = useInfiniteQuery({
    ...orpc.account.sandbox.listSnapshots.infiniteOptions({
      input: (cursor?: string) => ({
        ...(input ?? {}),
        limit: input?.limit ?? DEFAULT_SNAPSHOT_LIMIT,
        cursor,
      }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
      placeholderData: keepPreviousData,
    }),
  })
  const snapshots = query.data?.pages.flatMap((p) => p.snapshots) ?? []
  return {
    ...query,
    snapshots,
    hasMore: query.data?.pages[query.data.pages.length - 1]?.hasMore ?? false,
  }
}

export function useGetSnapshot(idOrName: string | undefined) {
  return useQuery({
    ...orpc.account.sandbox.getSnapshot.queryOptions({
      input: { idOrName: idOrName ?? '' },
    }),
    enabled: !!idOrName,
  })
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.createSnapshot.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().snapshots })
      },
    }),
  })
}

export function useRemoveSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.removeSnapshot.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().snapshots })
      },
    }),
  })
}

export function useActivateSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.activateSnapshot.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().snapshots })
      },
    }),
  })
}

export function useDeactivateSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.deactivateSnapshot.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().snapshots })
      },
    }),
  })
}

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

export function useListRegistries() {
  return useQuery(orpc.account.sandbox.listRegistries.queryOptions())
}

export function useCreateRegistry() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.createRegistry.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().registries })
      },
    }),
  })
}

export function useUpdateRegistry() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.updateRegistry.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().registries })
      },
    }),
  })
}

export function useDeleteRegistry() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.deleteRegistry.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().registries })
      },
    }),
  })
}

// ---------------------------------------------------------------------------
// Volumes
// ---------------------------------------------------------------------------

export function useListVolumes(includeDeleted?: boolean) {
  return useQuery(
    orpc.account.sandbox.listVolumes.queryOptions({
      input: { includeDeleted: includeDeleted ?? false },
    }),
  )
}

export function useCreateVolume() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.createVolume.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().volumes })
      },
    }),
  })
}

export function useDeleteVolume() {
  const queryClient = useQueryClient()
  return useMutation({
    ...orpc.account.sandbox.deleteVolume.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sandboxQueryKeys().volumes })
      },
    }),
  })
}
