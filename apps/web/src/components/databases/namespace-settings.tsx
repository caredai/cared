import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Slider } from '@cared/ui/components/slider'
import { cn } from '@cared/ui/lib/utils'

import { CopyButton } from '@/components/copy-button'
import { SectionTitle } from '@/components/section'
import {
  useDatabaseNamespace,
  useDeleteDatabaseNamespace,
  useUpdateDatabaseNamespace,
} from '@/hooks/use-database'
import { formatComputeRange, formatHistoryRetention, formatSuspendTimeout } from './database-format'
import { formatDatabaseRegion } from './region-label'

const SETTINGS_NAV = [
  { id: 'general', label: 'General' },
  { id: 'compute', label: 'Compute' },
  { id: 'history', label: 'History window' },
  { id: 'updates', label: 'Updates' },
  { id: 'collaborators', label: 'Collaborators' },
  { id: 'hipaa', label: 'HIPAA support' },
  { id: 'networking', label: 'Networking' },
  { id: 'auth', label: 'Authentication Providers' },
  { id: 'replication', label: 'Logical Replication' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'delete', label: 'Delete' },
] as const

/** History retention presets (seconds) aligned with Neon free-tier slider. */
const HISTORY_RETENTION_PRESETS = [
  { label: '0h', seconds: 0 },
  { label: '1h', seconds: 3600 },
  { label: '2h', seconds: 7200 },
  { label: '6h', seconds: 21_600 },
] as const

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

function historyPresetIndex(seconds: number): number {
  let best = 0
  let bestDiff = Math.abs(seconds - HISTORY_RETENTION_PRESETS[0].seconds)
  for (let i = 1; i < HISTORY_RETENTION_PRESETS.length; i++) {
    const diff = Math.abs(seconds - (HISTORY_RETENTION_PRESETS[i]?.seconds ?? 0))
    if (diff < bestDiff) {
      best = i
      bestDiff = diff
    }
  }
  return best
}

function computeSizeValue(minCu: number, maxCu: number): string {
  return COMPUTE_SIZE_OPTIONS.find((o) => o.min === minCu && o.max === maxCu)?.value ?? '0.25:2'
}

function suspendTimeoutValue(seconds: number | undefined): string {
  const normalized = seconds === 0 || seconds === undefined ? 300 : seconds
  return SUSPEND_TIMEOUT_OPTIONS.find((o) => o.seconds === normalized)?.value ?? '300'
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

interface NamespaceSettingsProps {
  namespaceId: string
  accountIdNoPrefix: string
}

function SettingsNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <nav className="hidden lg:block w-44 shrink-0">
      <ul className="space-y-0.5 sticky top-6">
        {SETTINGS_NAV.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(item.id)
                document.getElementById(`settings-${item.id}`)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
              className={cn(
                'text-sm w-full text-left py-1.5 pl-3 border-l-2 transition-colors',
                activeId === item.id
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
                item.id === 'delete' && 'text-destructive hover:text-destructive',
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card id={`settings-${id}`} className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ComputeDefaultsDialog({
  open,
  onOpenChange,
  minCu,
  maxCu,
  suspendSeconds,
  isUpdating,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  minCu: number
  maxCu: number
  suspendSeconds: number | undefined
  isUpdating: boolean
  onSave: (settings: {
    autoscalingLimitMinCu: number
    autoscalingLimitMaxCu: number
    suspendTimeoutSeconds: number
  }) => Promise<void>
}) {
  const [size, setSize] = useState(() => computeSizeValue(minCu, maxCu))
  const [suspendTimeout, setSuspendTimeout] = useState(() => suspendTimeoutValue(suspendSeconds))

  useEffect(() => {
    if (!open) return
    setSize(computeSizeValue(minCu, maxCu))
    setSuspendTimeout(suspendTimeoutValue(suspendSeconds))
  }, [maxCu, minCu, open, suspendSeconds])

  const originalSize = computeSizeValue(minCu, maxCu)
  const originalSuspendTimeout = suspendTimeoutValue(suspendSeconds)
  const changed = size !== originalSize || suspendTimeout !== originalSuspendTimeout

  const handleSave = async () => {
    await onSave({
      ...parseComputeSize(size),
      suspendTimeoutSeconds: parseSuspendTimeout(suspendTimeout),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modify compute defaults</DialogTitle>
          <DialogDescription>
            New computes start with these autoscaling and scale-to-zero settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
          <Button onClick={() => void handleSave()} disabled={!changed || isUpdating}>
            {isUpdating ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NamespaceSettings({ namespaceId, accountIdNoPrefix }: NamespaceSettingsProps) {
  const router = useRouter()
  const namespace = useDatabaseNamespace(namespaceId)
  const { updateDatabaseNamespace, isUpdating } = useUpdateDatabaseNamespace(namespaceId)
  const { deleteDatabaseNamespace, isDeleting } = useDeleteDatabaseNamespace()

  const [activeNav, setActiveNav] = useState('general')
  const [name, setName] = useState(namespace.name)
  const [historyIndex, setHistoryIndex] = useState(() =>
    historyPresetIndex(namespace.historyRetentionSeconds),
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [replicationOpen, setReplicationOpen] = useState(false)
  const [computeOpen, setComputeOpen] = useState(false)

  const defaultEndpoint = namespace.defaultEndpointSettings
  const minCu = defaultEndpoint?.autoscalingLimitMinCu ?? 0.25
  const maxCu = defaultEndpoint?.autoscalingLimitMaxCu ?? 2
  const suspendSeconds = defaultEndpoint?.suspendTimeoutSeconds
  const logicalReplicationEnabled = namespace.settings?.enableLogicalReplication ?? false

  useEffect(() => {
    setName(namespace.name)
    setHistoryIndex(historyPresetIndex(namespace.historyRetentionSeconds))
  }, [namespace.name, namespace.historyRetentionSeconds])

  const handleSaveGeneral = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Name is required')
      return
    }
    await updateDatabaseNamespace({ name: trimmed })
  }

  const handleSaveHistory = async () => {
    const preset = HISTORY_RETENTION_PRESETS[historyIndex]
    if (!preset) return
    await updateDatabaseNamespace({
      settings: { historyRetentionSeconds: preset.seconds },
    })
  }

  const handleEnableReplication = async () => {
    await updateDatabaseNamespace({
      settings: { enableLogicalReplication: true },
    })
    setReplicationOpen(false)
  }

  const handleSaveComputeDefaults = async (settings: {
    autoscalingLimitMinCu: number
    autoscalingLimitMaxCu: number
    suspendTimeoutSeconds: number
  }) => {
    await updateDatabaseNamespace({ settings })
  }

  const handleDeleteNamespace = async () => {
    await deleteDatabaseNamespace(namespaceId)
    setDeleteOpen(false)
    void router.navigate({
      to: '/acc_{$accountIdNoPrefix}/databases',
      params: { accountIdNoPrefix },
    })
  }

  const historyChanged =
    HISTORY_RETENTION_PRESETS[historyIndex]?.seconds !== namespace.historyRetentionSeconds
  const generalChanged = name.trim() !== namespace.name

  return (
    <div className="space-y-6">
      <SectionTitle title="Project settings" />

      <div className="flex gap-10">
        <div className="flex-1 min-w-0 space-y-6">
          <SettingsSection
            id="general"
            title="General"
            description="Manage your namespace display name and identifier."
          >
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="namespace-id">Namespace ID</Label>
                <div className="flex gap-1">
                  <Input
                    id="namespace-id"
                    value={namespace.id}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <CopyButton value={namespace.id} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="namespace-name">Namespace name</Label>
                <Input id="namespace-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button
                onClick={() => void handleSaveGeneral()}
                disabled={!generalChanged || isUpdating}
              >
                Save
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            id="compute"
            title="Compute defaults"
            description="These defaults are used as the initial settings for primary and read replica computes you create. See documentation for supported compute sizes."
          >
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Compute size: </span>
                <span className="font-medium">{formatComputeRange(minCu, maxCu)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Scale to zero: </span>
                <span className="font-medium">{formatSuspendTimeout(suspendSeconds)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Region: </span>
                <span className="font-medium">{formatDatabaseRegion(namespace.regionId)}</span>
              </p>
              {namespace.isLowCost && (
                <p className="text-muted-foreground">
                  Upgrade to control compute size and scale-to-zero settings.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={namespace.isLowCost}
                onClick={() => setComputeOpen(true)}
              >
                Modify defaults
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            id="history"
            title="History window"
            description="Choose how long to keep change history for instant restore, time travel, and branching from past states."
          >
            <div className="space-y-6 max-w-lg">
              <div className="space-y-4">
                <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                  {HISTORY_RETENTION_PRESETS.map((p) => (
                    <span key={p.label}>{p.label}</span>
                  ))}
                </div>
                <Slider
                  min={0}
                  max={HISTORY_RETENTION_PRESETS.length - 1}
                  step={1}
                  value={[historyIndex]}
                  onValueChange={([v]) => setHistoryIndex(v ?? 0)}
                  disabled={
                    namespace.isLowCost && historyIndex === HISTORY_RETENTION_PRESETS.length - 1
                  }
                />
                <p className="text-sm">
                  Current:{' '}
                  <span className="font-medium">
                    {formatHistoryRetention(HISTORY_RETENTION_PRESETS[historyIndex]?.seconds ?? 0)}
                  </span>
                </p>
              </div>
              {namespace.isLowCost && (
                <p className="text-sm text-muted-foreground">
                  Need a larger restore window? Upgrade your plan to get up to 30 days.
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => void handleSaveHistory()}
                disabled={!historyChanged || isUpdating}
              >
                Save
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            id="updates"
            title="Updates"
            description="Updates keep computes on the latest Postgres version and security patches."
          >
            <Button variant="outline" size="sm" disabled>
              Upgrade to customize
            </Button>
          </SettingsSection>

          <SettingsSection id="collaborators" title="Collaborators">
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              You have not shared this namespace with anyone yet.
            </div>
            <Button variant="outline" size="sm" className="mt-4" disabled>
              Invite
            </Button>
          </SettingsSection>

          <SettingsSection id="hipaa" title="HIPAA compliance">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable HIPAA compliance to process protected health information (PHI).
              </p>
              <Badge variant="secondary">HIPAA compliance disabled</Badge>
              <Button size="sm" disabled>
                Enable
              </Button>
              <p className="text-xs text-muted-foreground">
                Your current plan does not support HIPAA compliance.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection id="networking" title="Networking">
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Allow traffic via the public internet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade to limit access to trusted IP addresses.
                  </p>
                </div>
                <Badge>On</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div>
                  <p className="text-sm font-medium">Allow traffic via Virtual Private Network</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade to connect via VPC endpoints.
                  </p>
                </div>
                <Badge variant="secondary">Off</Badge>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="auth"
            title="Authentication providers"
            description="Add a JWT authority to secure your Data API."
          >
            <Button size="sm" disabled>
              Set up authentication provider
            </Button>
          </SettingsSection>

          <SettingsSection
            id="replication"
            title="Logical replication"
            description="Replicate data changes from this namespace to external services. Cannot be disabled once enabled."
          >
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>
                  Enabling logical replication restarts all computes and drops active connections.
                  It sets Postgres wal_level to logical and cannot be turned off.
                </p>
              </div>
              {logicalReplicationEnabled ? (
                <Badge>Enabled</Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplicationOpen(true)}
                  disabled={isUpdating}
                >
                  Enable
                </Button>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            id="transfer"
            title="Transfer project"
            description="Move this namespace to another organization or create a claim link."
          >
            <Button variant="outline" size="sm" disabled>
              Transfer project
            </Button>
          </SettingsSection>

          <SettingsSection id="delete" title="Delete project">
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                <p>
                  Permanently delete namespace <span className="font-mono">{namespace.id}</span>.
                  This action is not reversible.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete project
              </Button>
            </div>
          </SettingsSection>
        </div>

        <SettingsNav activeId={activeNav} onSelect={setActiveNav} />
      </div>

      <AlertDialog open={replicationOpen} onOpenChange={setReplicationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable logical replication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restart all computes and cannot be undone. Active connections will be
              dropped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleEnableReplication()}>
              Enable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ComputeDefaultsDialog
        open={computeOpen}
        onOpenChange={setComputeOpen}
        minCu={minCu}
        maxCu={maxCu}
        suspendSeconds={suspendSeconds}
        isUpdating={isUpdating}
        onSave={handleSaveComputeDefaults}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete namespace</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete &quot;{namespace.name}&quot; and all associated Neon resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => void handleDeleteNamespace()}
            >
              {isDeleting ? 'Deleting…' : 'Delete project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
