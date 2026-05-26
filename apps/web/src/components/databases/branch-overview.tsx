import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Archive,
  ChevronRight,
  Eye,
  EyeOff,
  GitBranch,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

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
import { Card, CardContent } from '@cared/ui/components/card'
import { Checkbox } from '@cared/ui/components/checkbox'
import { DataTable } from '@cared/ui/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cared/ui/components/dropdown-menu'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cared/ui/components/tabs'
import { cn } from '@cared/ui/lib/utils'

import type { Database, DatabaseBranch, DatabaseEndpoint, DatabaseRole } from '@/hooks/use-database'
import type { ColumnDef } from '@tanstack/react-table'
import { CopyButton } from '@/components/copy-button'
import { SectionTitle } from '@/components/section'
import {
  useCreateDatabaseBranchDatabase,
  useCreateDatabaseBranchRole,
  useCreateDatabaseEndpoint,
  useDatabaseBranch,
  useDatabaseBranchCount,
  useDatabaseBranchDatabases,
  useDatabaseBranchEndpoints,
  useDatabaseBranches,
  useDatabaseBranchRoleAction,
  useDatabaseBranchRoles,
  useDatabaseEndpointAction,
  useDatabaseEndpoints,
  useDatabaseNamespace,
  useDeleteDatabaseBranchDatabase,
  useNamespaceUsageLimits,
  useSetDefaultDatabaseBranch,
  useUpdateDatabaseBranch,
  useUpdateDatabaseEndpoint,
} from '@/hooks/use-database'
import { ConnectDialog } from './connect-dialog'
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

const COMPUTE_SIZE_OPTIONS = [
  { value: '0.25:1', label: '.25 ↔ 1 CU', min: 0.25, max: 1 },
  { value: '0.25:2', label: '.25 ↔ 2 CU', min: 0.25, max: 2 },
  { value: '1:4', label: '1 ↔ 4 CU', min: 1, max: 4 },
  { value: '2:8', label: '2 ↔ 8 CU', min: 2, max: 8 },
  { value: '4:16', label: '4 ↔ 16 CU', min: 4, max: 16 },
] as const

const SUSPEND_TIMEOUT_OPTIONS = [
  { value: '60', label: '1 minute', seconds: 60 },
  { value: '300', label: '5 minutes', seconds: 300 },
  { value: '900', label: '15 minutes', seconds: 900 },
  { value: '3600', label: '1 hour', seconds: 3600 },
  { value: '-1', label: 'Never suspend', seconds: -1 },
] as const

function computeSizeValue(minCu: number, maxCu: number): string {
  return COMPUTE_SIZE_OPTIONS.find((o) => o.min === minCu && o.max === maxCu)?.value ?? '0.25:2'
}

function suspendTimeoutValue(seconds: number): string {
  return SUSPEND_TIMEOUT_OPTIONS.find((o) => o.seconds === seconds)?.value ?? '300'
}

function parseComputeSize(value: string) {
  const option = COMPUTE_SIZE_OPTIONS.find((o) => o.value === value) ?? COMPUTE_SIZE_OPTIONS[1]
  return {
    autoscalingLimitMinCu: option.min,
    autoscalingLimitMaxCu: option.max,
  }
}

function parseSuspendTimeout(value: string): number {
  return SUSPEND_TIMEOUT_OPTIONS.find((o) => o.value === value)?.seconds ?? 300
}

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

function AddReadReplicaDialog({
  namespaceId,
  branchId,
  open,
  onOpenChange,
}: {
  namespaceId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [size, setSize] = useState('0.25:2')
  const [suspendTimeout, setSuspendTimeout] = useState('300')
  const { createDatabaseEndpoint, isCreating } = useCreateDatabaseEndpoint(namespaceId)

  const handleCreate = async () => {
    await createDatabaseEndpoint({
      namespaceId,
      branchId,
      type: 'read_only',
      name: name.trim() || undefined,
      ...parseComputeSize(size),
      suspendTimeoutSeconds: parseSuspendTimeout(suspendTimeout),
    })
    setName('')
    setSize('0.25:2')
    setSuspendTimeout('300')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add read replica</DialogTitle>
          <DialogDescription>
            Create a read-only compute for this branch to serve read traffic separately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="read-replica-name">Name</Label>
            <Input
              id="read-replica-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Analytics replica"
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label>Compute size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPUTE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scale to zero</Label>
            <Select value={suspendTimeout} onValueChange={setSuspendTimeout}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUSPEND_TIMEOUT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create read replica'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditEndpointDialog({
  namespaceId,
  endpoint,
  open,
  onOpenChange,
}: {
  namespaceId: string
  endpoint: DatabaseEndpoint | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [size, setSize] = useState('0.25:2')
  const [suspendTimeout, setSuspendTimeout] = useState('300')
  const { updateDatabaseEndpoint, isUpdating } = useUpdateDatabaseEndpoint(namespaceId)

  useEffect(() => {
    if (!endpoint) return
    setName(endpoint.name ?? '')
    setSize(computeSizeValue(endpoint.autoscalingLimitMinCu, endpoint.autoscalingLimitMaxCu))
    setSuspendTimeout(suspendTimeoutValue(endpoint.suspendTimeoutSeconds))
  }, [endpoint])

  const handleSave = async () => {
    if (!endpoint) return
    await updateDatabaseEndpoint({
      namespaceId,
      endpointId: endpoint.id,
      name: name.trim() || endpointDisplayName(endpoint),
      ...parseComputeSize(size),
      suspendTimeoutSeconds: parseSuspendTimeout(suspendTimeout),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit compute</DialogTitle>
          <DialogDescription>
            Adjust the compute name, autoscaling range, and scale-to-zero behavior.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="compute-name">Name</Label>
            <Input
              id="compute-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={endpoint ? endpointDisplayName(endpoint) : 'Primary'}
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label>Compute size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPUTE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scale to zero</Label>
            <Select value={suspendTimeout} onValueChange={setSuspendTimeout}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUSPEND_TIMEOUT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={isUpdating || !endpoint}>
            {isUpdating ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RenameBranchDialog({
  namespaceId,
  branch,
  open,
  onOpenChange,
}: {
  namespaceId: string
  branch: DatabaseBranch
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState(branch.name)
  const { updateDatabaseBranch, isUpdating } = useUpdateDatabaseBranch(namespaceId)

  useEffect(() => {
    setName(branch.name)
  }, [branch.name])

  const trimmed = name.trim()
  const changed = trimmed !== branch.name

  const handleSave = async () => {
    if (!trimmed || !changed) return
    await updateDatabaseBranch({
      namespaceId,
      branchId: branch.id,
      name: trimmed,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename branch</DialogTitle>
          <DialogDescription>Update the display name for this branch.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="branch-name">Branch name</Label>
          <Input
            id="branch-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={256}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={!trimmed || !changed || isUpdating}>
            {isUpdating ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateRoleDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: { name: string; noLogin?: boolean }) => Promise<unknown>
  isCreating: boolean
}) {
  const [name, setName] = useState('')
  const [noLogin, setNoLogin] = useState(false)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Role name is required')
      return
    }
    await onCreate({ name: trimmed, noLogin })
    setName('')
    setNoLogin(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
          <DialogDescription>Create a Postgres role on this branch.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="overview-role-name">Role name</Label>
            <Input id="overview-role-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={noLogin}
              onCheckedChange={(checked) => setNoLogin(checked === true)}
            />
            No login
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isCreating} onClick={() => void handleCreate()}>
            {isCreating ? 'Creating…' : 'Create role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateDatabaseDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: { name: string; ownerName?: string }) => Promise<unknown>
  isCreating: boolean
}) {
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Database name is required')
      return
    }
    await onCreate({ name: trimmed, ownerName: ownerName.trim() || undefined })
    setName('')
    setOwnerName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create database</DialogTitle>
          <DialogDescription>Create a Postgres database on this branch.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="overview-database-name">Database name</Label>
            <Input
              id="overview-database-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overview-database-owner">Owner role</Label>
            <Input
              id="overview-database-owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Defaults to database name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isCreating} onClick={() => void handleCreate()}>
            {isCreating ? 'Creating…' : 'Create database'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [readReplicaOpen, setReadReplicaOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [databaseOpen, setDatabaseOpen] = useState(false)
  const [setDefaultOpen, setSetDefaultOpen] = useState(false)
  const [endpointToEdit, setEndpointToEdit] = useState<DatabaseEndpoint | null>(null)
  const [endpointToDelete, setEndpointToDelete] = useState<DatabaseEndpoint | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({})

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
  const { setDefaultDatabaseBranch, isSettingDefault } = useSetDefaultDatabaseBranch(namespaceId)
  const { createDatabaseBranchRole, isCreating: isCreatingRole } = useCreateDatabaseBranchRole(
    namespaceId,
    branchId,
  )
  const {
    getRolePassword,
    resetRolePassword,
    deleteRole,
    isPending: isRoleActionPending,
  } = useDatabaseBranchRoleAction(namespaceId, branchId)
  const { createDatabaseBranchDatabase, isCreating: isCreatingDatabase } =
    useCreateDatabaseBranchDatabase(namespaceId, branchId)
  const { deleteDatabaseBranchDatabase, isDeleting: isDeletingDatabase } =
    useDeleteDatabaseBranchDatabase(namespaceId, branchId)
  const {
    startDatabaseEndpoint,
    suspendDatabaseEndpoint,
    restartDatabaseEndpoint,
    deleteDatabaseEndpoint,
    isPending: isEndpointActionPending,
  } = useDatabaseEndpointAction(namespaceId)

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

  const handleDeleteEndpoint = async () => {
    if (!endpointToDelete) return
    await deleteDatabaseEndpoint(endpointToDelete.id)
    setEndpointToDelete(null)
  }

  const handleSetDefaultBranch = async () => {
    await setDefaultDatabaseBranch(branchId)
    setSetDefaultOpen(false)
  }

  const revealPassword = async (roleName: string) => {
    const result = await getRolePassword(roleName)
    setVisiblePasswords((current) => ({ ...current, [roleName]: result.password }))
  }

  const resetPassword = async (roleName: string) => {
    const result = await resetRolePassword(roleName)
    if (result.role.password) {
      setVisiblePasswords((current) => ({ ...current, [roleName]: result.role.password! }))
    }
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
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>Rename branch</DropdownMenuItem>
              <DropdownMenuItem disabled={branch.default} onClick={() => setSetDefaultOpen(true)}>
                Set as default
              </DropdownMenuItem>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label="Edit compute"
                            onClick={() => setEndpointToEdit(ep)}
                          >
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
                        <Button size="sm" onClick={() => setConnectOpen(true)}>
                          Connect
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEndpointToEdit(ep)}>
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Compute actions"
                              disabled={isEndpointActionPending}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ep.currentState === 'idle' ? (
                              <DropdownMenuItem
                                onClick={() => void startDatabaseEndpoint(ep.id)}
                                disabled={isEndpointActionPending}
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Start
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => void suspendDatabaseEndpoint(ep.id)}
                                disabled={isEndpointActionPending}
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => void restartDatabaseEndpoint(ep.id)}
                              disabled={isEndpointActionPending}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restart
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setEndpointToDelete(ep)}
                              disabled={ep.type === 'read_write' || isEndpointActionPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              <Button variant="outline" size="sm" onClick={() => setReadReplicaOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
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
              <Button size="sm" variant="outline" onClick={() => setRoleOpen(true)}>
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
                      {visiblePasswords[role.name] && (
                        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md bg-muted px-2 py-1">
                          <code className="truncate text-xs">{visiblePasswords[role.name]}</code>
                          <CopyButton value={visiblePasswords[role.name] ?? ''} />
                        </div>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRoleActionPending || role.authenticationMethod === 'no_login'}
                          onClick={() => void revealPassword(role.name)}
                        >
                          {visiblePasswords[role.name] ? (
                            <EyeOff className="h-4 w-4 mr-1.5" />
                          ) : (
                            <Eye className="h-4 w-4 mr-1.5" />
                          )}
                          {visiblePasswords[role.name] ? 'Hide' : 'Password'}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isRoleActionPending || role.authenticationMethod === 'no_login'}
                          aria-label="Reset password"
                          onClick={() => void resetPassword(role.name)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isRoleActionPending || role.protected}
                          aria-label="Delete role"
                          onClick={() => void deleteRole(role.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
              <Button size="sm" variant="outline" onClick={() => setDatabaseOpen(true)}>
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
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/data-editor"
                            params={{ accountIdNoPrefix, namespaceIdNoPrefix }}
                            search={{ branch: branchId }}
                          >
                            Edit data
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isDeletingDatabase}
                          aria-label="Delete database"
                          onClick={() => void deleteDatabaseBranchDatabase(db.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <ConnectDialog
        namespaceId={namespaceId}
        branches={allBranches}
        endpoints={projectEndpoints}
        initialBranchId={branchId}
        open={connectOpen}
        onOpenChange={setConnectOpen}
      />
      <RenameBranchDialog
        namespaceId={namespaceId}
        branch={branch}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <CreateRoleDialog
        open={roleOpen}
        onOpenChange={setRoleOpen}
        onCreate={createDatabaseBranchRole}
        isCreating={isCreatingRole}
      />
      <CreateDatabaseDialog
        open={databaseOpen}
        onOpenChange={setDatabaseOpen}
        onCreate={createDatabaseBranchDatabase}
        isCreating={isCreatingDatabase}
      />
      <AlertDialog open={setDefaultOpen} onOpenChange={setSetDefaultOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set default branch?</AlertDialogTitle>
            <AlertDialogDescription>
              New branches without a selected parent will be created from &quot;{branch.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSettingDefault}
              onClick={() => void handleSetDefaultBranch()}
            >
              {isSettingDefault ? 'Saving…' : 'Set default'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AddReadReplicaDialog
        namespaceId={namespaceId}
        branchId={branchId}
        open={readReplicaOpen}
        onOpenChange={setReadReplicaOpen}
      />
      <EditEndpointDialog
        namespaceId={namespaceId}
        endpoint={endpointToEdit}
        open={endpointToEdit != null}
        onOpenChange={(open) => !open && setEndpointToEdit(null)}
      />
      <AlertDialog
        open={endpointToDelete != null}
        onOpenChange={(open) => !open && setEndpointToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete compute endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Delete compute endpoint &quot;
              {endpointToDelete ? endpointDisplayName(endpointToDelete) : 'Compute'}&quot;. Existing
              connections to this compute will be dropped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
              disabled={isEndpointActionPending}
              onClick={() => void handleDeleteEndpoint()}
            >
              {isEndpointActionPending ? 'Deleting…' : 'Delete compute'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
