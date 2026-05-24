import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import type { AllowedDatabaseRegion } from '@cared/api/types'
import { ALLOWED_DATABASE_REGIONS, DatabaseTier, POSTGRES_VERSIONS } from '@cared/api/types'
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

import { useCreateDatabaseNamespace } from '@/hooks/use-database'
import { stripIdPrefix } from '@/lib/utils'
import { formatDatabaseRegion } from './region-label'

const DEFAULT_PG_VERSION = '17'
const DEFAULT_REGION = 'aws-us-west-2'

export function CreateNamespaceDialog({ accountIdNoPrefix }: { accountIdNoPrefix: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [pgVersion, setPgVersion] = useState<string>(DEFAULT_PG_VERSION)
  const [regionId, setRegionId] = useState<AllowedDatabaseRegion>(DEFAULT_REGION)

  const { createDatabaseNamespace, isCreating } = useCreateDatabaseNamespace()

  const resetForm = () => {
    setName('')
    setPgVersion(DEFAULT_PG_VERSION)
    setRegionId(DEFAULT_REGION)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Name is required')
      return
    }

    try {
      const result = await createDatabaseNamespace({
        name: trimmedName,
        tier: DatabaseTier.LOW_COST,
        regionId,
        pgVersion: Number(pgVersion),
      })

      setOpen(false)
      resetForm()

      const namespaceIdNoPrefix = stripIdPrefix(result.namespace.id)
      void router.navigate({
        to: '/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/dashboard',
        params: { accountIdNoPrefix, namespaceIdNoPrefix },
      })
    } catch (error) {
      console.error(error)
    }
  }

  const canSubmit = name.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Namespace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Namespace</DialogTitle>
          <DialogDescription>
            Provision a new Postgres namespace. Choose a name, Postgres version, and region.
          </DialogDescription>
        </DialogHeader>
        <CreateNamespaceFormFields
          name={name}
          pgVersion={pgVersion}
          regionId={regionId}
          onNameChange={setName}
          onPgVersionChange={setPgVersion}
          onRegionIdChange={setRegionId}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={!canSubmit || isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateNamespaceFormFields({
  name,
  pgVersion,
  regionId,
  onNameChange,
  onPgVersionChange,
  onRegionIdChange,
}: {
  name: string
  pgVersion: string
  regionId: AllowedDatabaseRegion
  onNameChange: (value: string) => void
  onPgVersionChange: (value: string) => void
  onRegionIdChange: (value: AllowedDatabaseRegion) => void
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="database-namespace-name">Name</Label>
        <Input
          id="database-namespace-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., app name or customer name"
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label>Postgres version</Label>
        <Select value={pgVersion} onValueChange={onPgVersionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {POSTGRES_VERSIONS.map((version) => (
              <SelectItem key={version} value={String(version)}>
                {version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Region</Label>
        <p className="text-[0.8rem] text-muted-foreground">
          Select the region closest to your application.
        </p>
        <Select
          value={regionId}
          onValueChange={(value) => onRegionIdChange(value as AllowedDatabaseRegion)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {ALLOWED_DATABASE_REGIONS.map((id) => (
              <SelectItem key={id} value={id}>
                {formatDatabaseRegion(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
