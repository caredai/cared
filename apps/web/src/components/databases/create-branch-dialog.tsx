import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@cared/ui/components/button'
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

import type { DatabaseBranch } from '@/hooks/use-database'
import { useCreateDatabaseBranch } from '@/hooks/use-database'

interface CreateBranchDialogProps {
  namespaceId: string
  branches: DatabaseBranch[]
  disabled?: boolean
  /** Pre-select parent when creating a child branch from overview. */
  defaultParentId?: string
  /** Hide parent picker when parent is fixed. */
  lockParent?: boolean
  triggerLabel?: string
}

export function CreateBranchDialog({
  namespaceId,
  branches,
  disabled,
  defaultParentId,
  lockParent,
  triggerLabel = 'New Branch',
}: CreateBranchDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')

  const { createDatabaseBranch, isCreating } = useCreateDatabaseBranch(namespaceId)

  const fallbackParent =
    branches.find((b) => b.default) ?? branches.find((b) => b.name === 'production') ?? branches[0]

  const resolvedDefaultParentId = defaultParentId ?? fallbackParent?.id ?? ''

  const resetForm = () => {
    setName('')
    setParentId(resolvedDefaultParentId)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen && resolvedDefaultParentId && !parentId) {
      setParentId(resolvedDefaultParentId)
    }
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Branch name is required')
      return
    }
    const effectiveParentId = parentId || resolvedDefaultParentId
    if (!effectiveParentId) {
      toast.error('Parent branch is required')
      return
    }

    try {
      await createDatabaseBranch({
        namespaceId,
        name: trimmedName,
        parentId: effectiveParentId,
      })
      setOpen(false)
      resetForm()
    } catch {
      // Toast handled in hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled || branches.length === 0}>
          <Plus className="h-4 w-4 mr-1.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create branch</DialogTitle>
          <DialogDescription>
            Create a new branch from an existing parent to experiment safely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch name</Label>
            <Input
              id="branch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="dev"
              maxLength={256}
            />
          </div>
          {!lockParent && (
            <div className="space-y-2">
              <Label>Parent branch</Label>
              <Select value={parentId || resolvedDefaultParentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                      {branch.default ? ' (default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create branch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
