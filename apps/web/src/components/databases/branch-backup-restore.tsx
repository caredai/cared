import { useMemo, useState } from 'react'
import { GitBranch, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@cared/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@cared/ui/components/card'
import { Input } from '@cared/ui/components/input'
import { Label } from '@cared/ui/components/label'

import { SectionTitle } from '@/components/section'
import {
  useCreateDatabaseBranch,
  useDatabaseBranch,
  useDatabaseNamespace,
} from '@/hooks/use-database'
import { formatAbsoluteDateTime, formatHistoryRetention } from './database-format'

interface BranchBackupRestoreProps {
  namespaceId: string
  branchId: string
}

function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function BranchBackupRestore({ namespaceId, branchId }: BranchBackupRestoreProps) {
  const namespace = useDatabaseNamespace(namespaceId)
  const branch = useDatabaseBranch(namespaceId, branchId)
  const { createDatabaseBranch, isCreating } = useCreateDatabaseBranch(namespaceId)

  const now = useMemo(() => new Date(), [])
  const earliestRestore = useMemo(
    () => new Date(now.getTime() - namespace.historyRetentionSeconds * 1000),
    [namespace.historyRetentionSeconds, now],
  )

  const [name, setName] = useState(`${branch.name}-restore`)
  const [restoreAt, setRestoreAt] = useState(toDatetimeLocalValue(now))
  const [parentLsn, setParentLsn] = useState('')

  const handleRestore = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Branch name is required')
      return
    }

    const timestamp = new Date(restoreAt)
    if (Number.isNaN(timestamp.getTime())) {
      toast.error('Restore time is invalid')
      return
    }

    await createDatabaseBranch({
      namespaceId,
      name: trimmedName,
      parentId: branchId,
      parentTimestamp: parentLsn.trim() ? undefined : timestamp.toISOString(),
      parentLsn: parentLsn.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Backup & Restore"
        description="Restore data by creating a new branch from a past timestamp or LSN."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">History window</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatHistoryRetention(namespace.historyRetentionSeconds)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Earliest restore point</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{formatAbsoluteDateTime(earliestRestore)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Source branch</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{branch.name}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create restore branch</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="restore-branch-name">Branch name</Label>
            <Input
              id="restore-branch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restore-at">Restore timestamp</Label>
            <Input
              id="restore-at"
              type="datetime-local"
              value={restoreAt}
              onChange={(e) => setRestoreAt(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="restore-lsn">LSN</Label>
            <Input
              id="restore-lsn"
              value={parentLsn}
              onChange={(e) => setParentLsn(e.target.value)}
              placeholder="Optional. Overrides timestamp when set."
              className="font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => void handleRestore()} disabled={isCreating}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              {isCreating ? 'Creating…' : 'Create restore branch'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
