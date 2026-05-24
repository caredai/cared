import { useMemo, useState } from 'react'
import { Info, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Button } from '@cared/ui/components/button'
import { DataTable } from '@cared/ui/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@cared/ui/components/tooltip'

import type { RegistryItem } from '@/hooks/use-sandbox'
import type { ColumnDef } from '@tanstack/react-table'
import {
  useCreateRegistry,
  useDeleteRegistry,
  useListRegistries,
  useUpdateRegistry,
} from '@/hooks/use-sandbox'

const emptyForm = {
  name: '',
  url: '',
  username: '',
  password: '',
  project: '',
}

export function RegistriesTab() {
  const [showDialog, setShowDialog] = useState(false)
  const [registryToEdit, setRegistryToEdit] = useState<RegistryItem | null>(null)
  const [registryToDelete, setRegistryToDelete] = useState<RegistryItem | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const { data: registriesData, refetch } = useListRegistries()
  const createMutation = useCreateRegistry()
  const updateMutation = useUpdateRegistry()
  const deleteMutation = useDeleteRegistry()

  const registries = registriesData?.registries ?? []

  const openCreate = () => {
    setRegistryToEdit(null)
    setFormData(emptyForm)
    setShowDialog(true)
  }

  const openEdit = (r: RegistryItem) => {
    setRegistryToEdit(r)
    setFormData({
      name: r.name,
      url: r.url,
      username: r.username,
      password: '',
      project: r.project,
    })
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      toast.error('Name and username are required')
      return
    }
    if (!registryToEdit && !formData.password.trim()) {
      toast.error('Password is required when creating a registry')
      return
    }
    try {
      if (registryToEdit) {
        await updateMutation.mutateAsync({
          id: registryToEdit.id,
          name: formData.name.trim(),
          url: formData.url.trim() || 'docker.io',
          username: formData.username.trim(),
          password: formData.password.trim(),
          project: formData.project.trim() || undefined,
        })
        toast.success('Registry updated')
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          url: formData.url.trim() || 'docker.io',
          username: formData.username.trim(),
          password: formData.password.trim(),
          project: formData.project.trim() || undefined,
        })
        toast.success('Registry created')
      }
      setShowDialog(false)
      setFormData(emptyForm)
      setRegistryToEdit(null)
      void refetch()
    } catch (e) {
      toast.error(registryToEdit ? 'Failed to update registry' : 'Failed to create registry')
      console.error(e)
    }
  }

  const handleDelete = (r: RegistryItem) => {
    setRegistryToDelete(r)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!registryToDelete) return
    try {
      await deleteMutation.mutateAsync({ id: registryToDelete.id })
      toast.success('Registry deleted')
      setShowDeleteDialog(false)
      setRegistryToDelete(null)
      void refetch()
    } catch (e) {
      toast.error('Failed to delete registry')
      console.error(e)
    }
  }

  const columns = useMemo<ColumnDef<RegistryItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'url',
        header: 'URL',
        cell: ({ row }) => row.original.url,
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => row.original.username,
      },
      {
        accessorKey: 'project',
        header: 'Project',
        cell: ({ row }) => row.original.project,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="w-full flex justify-end items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(r)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [],
  )

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Registry
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={registries}
        searchKeys={['name', 'url', 'username']}
        searchPlaceholder="Search registries..."
        getRowId={(row) => row.id}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{registryToEdit ? 'Edit Registry' : 'Add Registry'}</DialogTitle>
            <DialogDescription>
              Registry details for images that are not publicly available. Leave URL blank for
              docker.io.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Registry Name</Label>
              <Input
                id="reg-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="My Registry"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="reg-url">Registry URL</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Defaults to docker.io when left blank</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="reg-url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://registry.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-username">Username</Label>
              <Input
                id="reg-username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">
                Password {registryToEdit && '(leave empty to keep current)'}
              </Label>
              <Input
                id="reg-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="reg-project">Project (optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Leave this empty for private Docker Hub entries</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="reg-project"
                value={formData.project}
                onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
                placeholder="my-project"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !formData.name.trim() ||
                !formData.username.trim() ||
                (!registryToEdit && !formData.password.trim())
              }
            >
              {registryToEdit
                ? updateMutation.isPending
                  ? 'Saving...'
                  : 'Save'
                : createMutation.isPending
                  ? 'Adding...'
                  : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete registry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this registry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRegistryToDelete(null)}>Cancel</AlertDialogCancel>
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
