import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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

import type { VolumeItem } from '@/hooks/use-sandbox'
import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import { useCreateVolume, useDeleteVolume, useListVolumes } from '@/hooks/use-sandbox'

function volumeStateLabel(state: string) {
  const s = state.toLowerCase()
  if (s === 'ready') return 'Ready'
  if (s === 'creating' || s === 'pending_create') return 'Creating'
  if (s === 'deleting' || s === 'pending_delete') return 'Deleting'
  if (s === 'deleted') return 'Deleted'
  if (s === 'error') return 'Error'
  return state
}

function volumeStateVariant(state: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = state.toLowerCase()
  if (s === 'ready') return 'default'
  if (s === 'creating' || s === 'pending_create' || s === 'deleting' || s === 'pending_delete')
    return 'secondary'
  if (s === 'error' || s === 'deleted') return 'destructive'
  return 'outline'
}

export function VolumesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [volumeToDelete, setVolumeToDelete] = useState<VolumeItem | null>(null)
  const [newVolumeName, setNewVolumeName] = useState('')

  const { data: volumesData, refetch } = useListVolumes()
  const createMutation = useCreateVolume()
  const deleteMutation = useDeleteVolume()

  const volumes = volumesData?.volumes ?? []

  const handleCreate = async () => {
    if (!newVolumeName.trim()) {
      toast.error('Volume name is required')
      return
    }
    try {
      await createMutation.mutateAsync({ name: newVolumeName.trim() })
      toast.success('Volume created')
      setShowCreateDialog(false)
      setNewVolumeName('')
      void refetch()
    } catch (e) {
      toast.error('Failed to create volume')
      console.error(e)
    }
  }

  const handleDelete = (volume: VolumeItem) => {
    setVolumeToDelete(volume)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!volumeToDelete) return
    try {
      await deleteMutation.mutateAsync({ id: volumeToDelete.id })
      toast.success('Volume deleted')
      setShowDeleteDialog(false)
      setVolumeToDelete(null)
      void refetch()
    } catch (e) {
      toast.error('Failed to delete volume')
      console.error(e)
    }
  }

  const columns = useMemo<ColumnDef<VolumeItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[140px] block">
            {row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'state',
        header: 'State',
        cell: ({ row }) => (
          <Badge variant={volumeStateVariant(row.original.state)}>
            {volumeStateLabel(row.original.state)}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const v = row.original
          const state = v.state.toLowerCase()
          const canDelete = !['deleting', 'deleted', 'pending_delete'].includes(state)

          return (
            <div className="w-full flex justify-end">
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(v)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [deleteMutation.isPending],
  )

  return (
    <>
      <SectionTitle title="Volumes" description="Create and manage volumes for sandbox storage" />
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Volume
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Volume</DialogTitle>
                <DialogDescription>
                  Create a new volume to attach to sandboxes. Volumes persist data across sandbox
                  lifecycles.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="volume-name">Volume Name</Label>
                  <Input
                    id="volume-name"
                    value={newVolumeName}
                    onChange={(e) => setNewVolumeName(e.target.value)}
                    placeholder="my-volume"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !newVolumeName.trim()}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={volumes}
          searchKeys={['name', 'id']}
          searchPlaceholder="Search volumes..."
          getRowId={(row) => row.id}
        />
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete volume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this volume? This action cannot be undone and all data
              in the volume will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVolumeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
