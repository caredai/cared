import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Archive,
  ChevronRight,
  GitBranch,
  MoreVertical,
  Pencil,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Card, CardContent } from '@cared/ui/components/card'
import { DataTable } from '@cared/ui/components/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Input } from '@cared/ui/components/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'

import type { Database, DatabaseBranch, DatabaseEndpoint, DatabaseRole } from '@/hooks/use-database'
import type { ColumnDef } from '@tanstack/react-table'
import { CopyButton } from '@/components/copy-button'
import { SectionTitle } from '@/components/section'
import {
  useDatabaseBranch,
  useDatabaseBranchCount,
  useDatabaseBranchDatabases,
  useDatabaseBranchEndpoints,
  useDatabaseBranches,
  useDatabaseBranchRoles,
  useDatabaseEndpoints,
  useDatabaseNamespace,
  useNamespaceUsageLimits,
  useUpdateDatabaseBranch,
} from '@/hooks/use-database'
import { CreateBranchDialog } from './create-branch-dialog'
import {
  endpointStateLabel,
  endpointStateVariant,
  formatAbsoluteDateTime,
  formatComputeRange,
  formatCuHours,
  formatStorageBytes,
  RelativeTime,
} from './database-format'

interface BranchOverviewProps {
  namespaceId: string
  accountIdNoPrefix: string
  namespaceIdNoPrefix: string
  branchId: string
}

function getPrimaryEndpoint(endpoints: DatabaseEndpoint[], branchId: string) {
  return (
    endpoints.find((ep) => ep.branchId === branchId && ep.type === 'read_write') ??
    endpoints.find((ep) => ep.branchId === branchId)
  )
}

function endpointDisplayName(ep: DatabaseEndpoint): string {
  return ep.name?.trim() || (ep.type === 'read_write' ? 'Primary' : 'Compute')
}

function endpointBadgeState(state: string): {
  label: string
  variant: 'default' | 'secondary' | 'outline'
} {
  if (state === 'idle') {
    return { label: 'SUSPENDED', variant: 'secondary' }
  }
  if (state === 'active') {
    return { label: 'ACTIVE', variant: 'default' }
  }
  return { label: endpointStateLabel(state).toUpperCase(), variant: endpointStateVariant(state) }
}

function formatRoleOwns(role: DatabaseRole, databases: Database[]): string {
  const owned = databases.filter((db) => db.ownerName === role.name)
  const first = owned[0]
  if (!first) return '—'
  if (owned.length === 1) return first.name
  return `${first.name} +${owned.length - 1}`
}

function MetadataItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 text-sm font-medium min-w-0">{children}</div>
    </div>
  )
}

export function BranchOverview({
  namespaceId,
  accountIdNoPrefix,
  namespaceIdNoPrefix,
  branchId,
}: BranchOverviewProps) {
  const [childSearch, setChildSearch] = useState('')
  const [activeTab, setActiveTab] = useState('computes')

  const namespace = useDatabaseNamespace(namespaceId)
  const branch = useDatabaseBranch(namespaceId, branchId)
  const branchEndpoints = useDatabaseBranchEndpoints(namespaceId, branchId)
  const roles = useDatabaseBranchRoles(namespaceId, branchId)
  const databases = useDatabaseBranchDatabases(namespaceId, branchId)
  const allBranches = useDatabaseBranches(namespaceId)
  const projectEndpoints = useDatabaseEndpoints(namespaceId)
  const branchCount = useDatabaseBranchCount(namespaceId)
  const usageLimits = useNamespaceUsageLimits(namespace)
  const { updateDatabaseBranch, isUpdating } = useUpdateDatabaseBranch(namespaceId)

  const isChild = Boolean(branch.parentId)
  const parentBranch = useMemo(
    () => allBranches.find((b) => b.id === branch.parentId),
    [allBranches, branch.parentId],
  )

  const childBranches = useMemo(
    () => allBranches.filter((b) => b.parentId === branchId),
    [allBranches, branchId],
  )

  const filteredChildBranches = useMemo(() => {
    const q = childSearch.trim().toLowerCase()
    if (!q) return childBranches
    return childBranches.filter((b) => b.name.toLowerCase().includes(q))
  }, [childBranches, childSearch])

  const isArchived = branch.currentState === 'archived'
  const atBranchLimit = branchCount >= usageLimits.maxBranches

  const handleProtect = async () => {
    await updateDatabaseBranch({
      namespaceId,
      branchId,
      protected: true,
    })
  }

  const overviewPath = '/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/overview' as const

  const childBranchColumns = useMemo<ColumnDef<DatabaseBranch, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Branch',
        cell: ({ row }) => (
          <Link
            to={overviewPath}
            params={{ accountIdNoPrefix, namespaceIdNoPrefix }}
            search={{ branch: row.original.id }}
            className="flex items-center gap-2 min-w-[140px] hover:underline"
          >
            <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{row.original.name}</span>
          </Link>
        ),
      },
      {
        id: 'parent',
        header: 'Parent',
        cell: () => <span className="text-sm">{branch.name}</span>,
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
          const ep = getPrimaryEndpoint(projectEndpoints, row.original.id)
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
          const ep = getPrimaryEndpoint(projectEndpoints, row.original.id)
          return <RelativeTime value={ep?.lastActive ?? ep?.suspendedAt} />
        },
      },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <MoreVertical className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [accountIdNoPrefix, branch.name, namespaceIdNoPrefix, projectEndpoints],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SectionTitle
            title={isChild ? 'Child branch overview' : 'Branch overview'}
            description={
              isChild && parentBranch ? (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Link
                    to={overviewPath}
                    params={{ accountIdNoPrefix, namespaceIdNoPrefix }}
                    search={{ branch: parentBranch.id }}
                    className="hover:underline"
                  >
                    {parentBranch.name}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">{branch.name}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{branch.name}</span>
                  {branch.default && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Default
                    </Badge>
                  )}
                </span>
              )
            }
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CreateBranchDialog
            namespaceId={namespaceId}
            branches={allBranches}
            disabled={atBranchLimit}
            defaultParentId={branchId}
            lockParent
            triggerLabel="Create child branch"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>Rename branch</DropdownMenuItem>
              <DropdownMenuItem disabled>Set as default</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {(isArchived || !branch.protected) && (
        <Card className="bg-muted/30 border-muted">
          <CardContent className="grid gap-6 p-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Archive className="h-4 w-4 text-muted-foreground" />
                Archive status
              </div>
              <p className="text-sm text-muted-foreground">
                {isArchived ? (
                  <>
                    Automatically archived on{' '}
                    <span className="text-foreground">
                      {formatAbsoluteDateTime(branch.stateChangedAt)}
                    </span>{' '}
                    due to inactivity.{' '}
                    <button type="button" className="underline hover:text-foreground">
                      Learn more
                    </button>
                  </>
                ) : (
                  'This branch is active and has not been archived.'
                )}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Automatic unarchive
              </div>
              <p className="text-sm text-muted-foreground">
                Querying will unarchive the branch automatically.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Disable archiving
              </div>
              <p className="text-sm text-muted-foreground">
                Enable branch protection to prevent this branch from being archived.
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={branch.protected || isUpdating}
                onClick={() => void handleProtect()}
              >
                Protect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetadataItem label="ID">
            <span className="truncate font-mono text-xs">{branch.id}</span>
            <CopyButton value={branch.id} />
          </MetadataItem>
          {isChild && parentBranch && (
            <MetadataItem label="Parent branch">
              <Link
                to={overviewPath}
                params={{ accountIdNoPrefix, namespaceIdNoPrefix }}
                search={{ branch: parentBranch.id }}
                className="hover:underline truncate"
              >
                {parentBranch.name}
              </Link>
              {branch.parentLsn != null && (
                <>
                  <span className="text-muted-foreground font-normal">LSN</span>
                  <span className="font-mono text-xs truncate">{branch.parentLsn}</span>
                  <CopyButton value={String(branch.parentLsn)} />
                </>
              )}
            </MetadataItem>
          )}
          <MetadataItem label="Created on">
            <span className="text-sm font-normal">{formatAbsoluteDateTime(branch.createdAt)}</span>
          </MetadataItem>
          <MetadataItem label="Data size">
            <span className="text-sm font-normal">
              {branch.logicalSize != null ? formatStorageBytes(branch.logicalSize) : '—'}
            </span>
          </MetadataItem>
          <MetadataItem label="Created by">
            <span className="inline-block h-5 w-5 rounded-full bg-emerald-500/80" title="—" />
          </MetadataItem>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="computes">Computes</TabsTrigger>
          <TabsTrigger value="roles-databases">Roles & Databases</TabsTrigger>
          <TabsTrigger value="children">Child branches</TabsTrigger>
        </TabsList>

        <TabsContent value="computes" className="mt-4 space-y-4">
          {branchEndpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No compute endpoints.</p>
          ) : (
            <div className="space-y-3">
              {branchEndpoints.map((ep) => {
                const badge = endpointBadgeState(ep.currentState)
                const suspendedAt = ep.suspendedAt ?? ep.lastActive
                return (
                  <Card key={ep.id}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{endpointDisplayName(ep)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Badge
                            variant={badge.variant}
                            className="text-[10px] uppercase tracking-wide"
                          >
                            {badge.label}
                          </Badge>
                          {ep.type === 'read_only' && (
                            <Badge variant="outline" className="text-[10px] uppercase">
                              RO
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <span className="shrink-0">Endpoint ID</span>
                            <span className="font-mono text-xs text-foreground truncate">
                              {ep.id}
                            </span>
                            <CopyButton value={ep.id} />
                          </span>
                          {suspendedAt && ep.currentState === 'idle' && (
                            <span>
                              Suspended{' '}
                              <RelativeTime value={suspendedAt} muted={false} className="inline" />
                            </span>
                          )}
                          <span className="tabular-nums">
                            {formatComputeRange(ep.autoscalingLimitMinCu, ep.autoscalingLimitMaxCu)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" disabled>
                          Connect
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <Card className="bg-muted/20">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground max-w-xl">
                Read Replicas: Scale your application by offloading your read workload to a
                read-only instance of your database.
              </p>
              <Button variant="outline" size="sm" disabled>
                Add Read Replica
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles-databases" className="mt-4 space-y-8">
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">Roles</h3>
                <p className="text-sm text-muted-foreground">
                  Manage the Postgres roles on this branch. Changes apply to this branch only.
                </p>
              </div>
              <Button size="sm" variant="outline" disabled>
                Add role
              </Button>
            </div>
            <div className="space-y-2">
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No roles.</p>
              ) : (
                roles.map((role) => (
                  <Card key={role.name}>
                    <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm">
                      <div className="min-w-[120px] font-medium">{role.name}</div>
                      <div className="text-muted-foreground">
                        <span className="text-xs block">Owns</span>
                        {formatRoleOwns(role, databases)}
                      </div>
                      <div className="text-muted-foreground">
                        <span className="text-xs block">Created</span>
                        <RelativeTime value={role.createdAt} muted={false} />
                      </div>
                      <div className="text-muted-foreground">
                        <span className="text-xs block">Last updated</span>
                        <RelativeTime value={role.updatedAt} muted={false} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" disabled>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">Databases</h3>
                <p className="text-sm text-muted-foreground">
                  Manage the Postgres databases on this branch. Changes apply to this branch only.
                </p>
              </div>
              <Button size="sm" variant="outline" disabled>
                Add database
              </Button>
            </div>
            <div className="space-y-2">
              {databases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No databases.</p>
              ) : (
                databases.map((db) => (
                  <Card key={db.name}>
                    <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm">
                      <div className="min-w-[120px] font-medium">{db.name}</div>
                      <div className="text-muted-foreground">
                        <span className="text-xs block">Owner</span>
                        {db.ownerName}
                      </div>
                      <div className="text-muted-foreground">
                        <span className="text-xs block">Created</span>
                        <RelativeTime value={db.createdAt} muted={false} />
                      </div>
                      <div className="text-muted-foreground">
                        <span className="text-xs block">Last updated</span>
                        <RelativeTime value={db.updatedAt} muted={false} />
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Button size="sm" variant="outline" disabled>
                          Edit data
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="children" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter branches by name"
              value={childSearch}
              onChange={(e) => setChildSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredChildBranches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {childBranches.length === 0
                ? 'No child branches yet. Create one to get started.'
                : 'No branches match your filter.'}
            </p>
          ) : (
            <DataTable columns={childBranchColumns} data={filteredChildBranches} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function BranchOverviewEmpty() {
  return (
    <p className="text-sm text-muted-foreground py-12 text-center">
      Select a branch from the sidebar to view its overview.
    </p>
  )
}
