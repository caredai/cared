import { useMemo, useState } from 'react'
import { GitBranch, MoreVertical, Search } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@cared/ui/components/alert-dialog'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { DataTable } from '@cared/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Input } from '@cared/ui/components/input'
import { cn } from '@cared/ui/lib/utils'

import type { DatabaseBranch, DatabaseEndpoint } from '@/hooks/use-database'
import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import {
  useDatabaseBranchCount,
  useDatabaseBranches,
  useDatabaseEndpoints,
  useDatabaseNamespace,
  useDeleteDatabaseBranch,
  useNamespaceUsageLimits,
} from '@/hooks/use-database'
import { CreateBranchDialog } from './create-branch-dialog'
import {
  endpointStateLabel,
  endpointStateVariant,
  formatComputeRange,
  formatCuHours,
  formatStorageBytes,
  RelativeTime,
} from './database-format'
import { NamespaceUsageCard } from './namespace-usage-card'

interface NamespaceBranchesProps {
  namespaceId: string
}

function getPrimaryEndpoint(endpoints: DatabaseEndpoint[], branchId: string) {
  return (
    endpoints.find((ep) => ep.branchId === branchId && ep.type === 'read_write') ??
    endpoints.find((ep) => ep.branchId === branchId)
  )
}

export function NamespaceBranches({ namespaceId }: NamespaceBranchesProps) {
  const [search, setSearch] = useState('')
  const [branchToDelete, setBranchToDelete] = useState<DatabaseBranch | null>(null)

  const namespace = useDatabaseNamespace(namespaceId)
  const branchCount = useDatabaseBranchCount(namespaceId)
  const endpoints = useDatabaseEndpoints(namespaceId)
  const usageLimits = useNamespaceUsageLimits(namespace)
  const branches = useDatabaseBranches(namespaceId, { namespaceId, limit: 100 })
  const { deleteDatabaseBranch, isDeleting } = useDeleteDatabaseBranch(namespaceId)

  const branchNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of branches) {
      map.set(b.id, b.name)
    }
    return map
  }, [branches])

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return branches
    return branches.filter((b) => b.name.toLowerCase().includes(q))
  }, [branches, search])

  const atBranchLimit = branchCount >= usageLimits.maxBranches

  const columns = useMemo<ColumnDef<DatabaseBranch, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Branch',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-[140px]">
            <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{row.original.name}</span>
            {row.original.default && (
              <Badge variant="secondary" className="text-xs font-normal">
                Default
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'parent',
        header: 'Parent',
        cell: ({ row }) => {
          const parentId = row.original.parentId
          if (!parentId) {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          return <span className="text-sm">{branchNameById.get(parentId) ?? parentId}</span>
        },
      },
      {
        id: 'compute',
        header: 'Compute',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatCuHours(row.original.activeTimeSeconds)} CU-hrs
          </span>
        ),
      },
      {
        id: 'primary_compute',
        header: 'Primary compute',
        cell: ({ row }) => {
          const ep = getPrimaryEndpoint(endpoints, row.original.id)
          if (!ep) {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          return (
            <div className="flex items-center gap-2 text-sm">
              <span className="tabular-nums whitespace-nowrap">
                {formatComputeRange(ep.autoscalingLimitMinCu, ep.autoscalingLimitMaxCu)}
              </span>
              <Badge variant={endpointStateVariant(ep.currentState)} className="text-xs">
                {endpointStateLabel(ep.currentState)}
              </Badge>
            </div>
          )
        },
      },
      {
        id: 'storage',
        header: 'Storage',
        cell: ({ row }) => {
          const size = row.original.logicalSize
          if (size == null) {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          return <span className="text-sm">{formatStorageBytes(size)}</span>
        },
      },
      {
        id: 'created_by',
        header: 'Created by',
        cell: () => <span className="text-sm text-muted-foreground">—</span>,
      },
      {
        id: 'last_active',
        header: 'Compute last active',
        cell: ({ row }) => {
          const ep = getPrimaryEndpoint(endpoints, row.original.id)
          return <RelativeTime value={ep?.lastActive} />
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const branch = row.original
          if (branch.default) return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setBranchToDelete(branch)}
                >
                  Delete branch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [branchNameById, endpoints],
  )

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return
    await deleteDatabaseBranch(branchToDelete.id)
    setBranchToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title={`${branchCount} / ${usageLimits.maxBranches} Branch${branchCount === 1 ? '' : 'es'}`}
          description="Instantly branch your data to deliver faster, safer experimentation, and more reliable CI/CD processes."
        />
        <CreateBranchDialog
          namespaceId={namespaceId}
          branches={branches}
          disabled={atBranchLimit}
        />
      </div>

      <NamespaceUsageCard
        namespace={namespace}
        branchCount={branchCount}
        usageLimits={usageLimits}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable columns={columns} data={filteredBranches} />

      <AlertDialog
        open={branchToDelete != null}
        onOpenChange={(open) => !open && setBranchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete branch &quot;{branchToDelete?.name}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
              disabled={isDeleting}
              onClick={() => void handleDeleteBranch()}
            >
              {isDeleting ? 'Deleting…' : 'Delete branch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
