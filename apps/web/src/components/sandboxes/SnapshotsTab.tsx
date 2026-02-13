import { useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
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
import { DataTable } from '@cared/ui/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'

import type { SnapshotItem } from '@/hooks/use-sandbox'
import type { ColumnDef } from '@tanstack/react-table'
import {
  useActivateSnapshot,
  useCreateSnapshot,
  useDeactivateSnapshot,
  useListRegions,
  useListSnapshots,
  useRemoveSnapshot,
} from '@/hooks/use-sandbox'

function snapshotStateLabel(state: string) {
  const s = state.toLowerCase()
  if (s === 'active') return 'Active'
  if (s === 'inactive') return 'Inactive'
  if (s === 'building' || s === 'pending' || s === 'pulling') return state
  if (s === 'error' || s === 'build_failed') return 'Error'
  if (s === 'removing') return 'Removing'
  return state
}

function snapshotStateVariant(state: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = state.toLowerCase()
  if (s === 'active') return 'default'
  if (s === 'inactive') return 'secondary'
  if (s === 'error' || s === 'build_failed' || s === 'removing') return 'destructive'
  return 'outline'
}

export function SnapshotsTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [snapshotToDelete, setSnapshotToDelete] = useState<SnapshotItem | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const [createName, setCreateName] = useState('')
  const [createImageName, setCreateImageName] = useState('')
  const [createCpu, setCreateCpu] = useState<string>('')
  const [createMemory, setCreateMemory] = useState<string>('')
  const [createDisk, setCreateDisk] = useState<string>('')
  const [createRegionId, setCreateRegionId] = useState<string>('')

  const { data: regionsData } = useListRegions()
  const { snapshots, refetch } = useListSnapshots()
  const createMutation = useCreateSnapshot()
  const removeMutation = useRemoveSnapshot()
  const activateMutation = useActivateSnapshot()
  const deactivateMutation = useDeactivateSnapshot()

  const regions = regionsData?.regions ?? []

  const runAction = async (id: string, name: string, fn: () => Promise<unknown>) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await fn()
      toast.success(`${name} succeeded`)
      void refetch()
    } catch (e) {
      toast.error(`${name} failed`)
      console.error(e)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDelete = (snapshot: SnapshotItem) => {
    setSnapshotToDelete(snapshot)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!snapshotToDelete) return
    await runAction(snapshotToDelete.id, 'Delete snapshot', () =>
      removeMutation.mutateAsync({ id: snapshotToDelete.id }),
    )
    setShowDeleteDialog(false)
    setSnapshotToDelete(null)
  }

  const handleCreate = async () => {
    if (!createName.trim() || !createImageName.trim()) {
      toast.error('Name and image are required')
      return
    }
    try {
      await createMutation.mutateAsync({
        name: createName.trim(),
        imageName: createImageName.trim(),
        cpu: createCpu ? Number(createCpu) : undefined,
        memory: createMemory ? Number(createMemory) : undefined,
        disk: createDisk ? Number(createDisk) : undefined,
        regionIds: createRegionId || undefined,
      })
      toast.success('Snapshot created')
      setShowCreateDialog(false)
      setCreateName('')
      setCreateImageName('')
      setCreateCpu('')
      setCreateMemory('')
      setCreateDisk('')
      setCreateRegionId('')
      void refetch()
    } catch (e) {
      toast.error('Failed to create snapshot')
      console.error(e)
    }
  }

  const columns = useMemo<ColumnDef<SnapshotItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium">{s.name}</span>
              {s.general && <Badge variant="secondary">System</Badge>}
            </div>
          )
        },
      },
      {
        accessorKey: 'state',
        header: 'State',
        cell: ({ row }) => (
          <Badge variant={snapshotStateVariant(row.original.state)}>
            {snapshotStateLabel(row.original.state)}
          </Badge>
        ),
      },
      {
        accessorKey: 'imageName',
        header: 'Image',
        cell: ({ row }) => row.original.imageName ?? '—',
      },
      {
        accessorKey: 'cpu',
        header: 'CPU',
        cell: ({ row }) => `${row.original.cpu} vCPU`,
      },
      {
        accessorKey: 'mem',
        header: 'Memory',
        cell: ({ row }) => `${row.original.mem} GiB`,
      },
      {
        accessorKey: 'disk',
        header: 'Disk',
        cell: ({ row }) => `${row.original.disk} GiB`,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const s = row.original
          const loading = actionLoading[s.id]
          const state = s.state.toLowerCase()
          // Platform-managed (general) snapshots are read-only: no edit/delete/activate/deactivate
          if (s.general) {
            return <div className="w-full flex justify-end" />
          }

          return (
            <div className="w-full flex justify-end items-center gap-1">
              {state === 'inactive' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() =>
                    runAction(s.id, 'Activate', () => activateMutation.mutateAsync({ id: s.id }))
                  }
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activate'}
                </Button>
              )}
              {state === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() =>
                    runAction(s.id, 'Deactivate', () =>
                      deactivateMutation.mutateAsync({ id: s.id }),
                    )
                  }
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deactivate'}
                </Button>
              )}
              {!['removing'].includes(state) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  disabled={loading}
                  onClick={() => handleDelete(s)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [
      actionLoading,
      activateMutation,
      deactivateMutation,
      removeMutation,
      refetch,
    ],
  )

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Snapshot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Snapshot</DialogTitle>
              <DialogDescription>
                Register a new snapshot to be used for sandboxes. Name and image are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="snapshot-name">Snapshot Name</Label>
                <Input
                  id="snapshot-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="ubuntu-4vcpu-8ram-100gb"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="snapshot-image">Image</Label>
                <Input
                  id="snapshot-image"
                  value={createImageName}
                  onChange={(e) => setCreateImageName(e.target.value)}
                  placeholder="ubuntu:22.04"
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={createRegionId} onValueChange={setCreateRegionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>CPU (vCPU)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={createCpu}
                    onChange={(e) => setCreateCpu(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Memory (GiB)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={createMemory}
                    onChange={(e) => setCreateMemory(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Disk (GiB)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={createDisk}
                    onChange={(e) => setCreateDisk(e.target.value)}
                    placeholder="3"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !createName.trim() || !createImageName.trim()}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={snapshots}
        searchKeys={['name', 'imageName']}
        searchPlaceholder="Search snapshots..."
        getRowId={(row) => row.id}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete snapshot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this snapshot? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSnapshotToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
