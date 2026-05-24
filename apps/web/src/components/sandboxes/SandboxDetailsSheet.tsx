import { format, formatDistanceToNow } from 'date-fns'
import { Archive, Play, Trash2, Wrench, X } from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@cared/ui/components/sheet'

import type { SandboxItem } from '@/hooks/use-sandbox'
import { CopyButton } from '@/components/copy-button'

function stateLabel(state: string | undefined) {
  if (!state) return 'unknown'
  const s = state.toLowerCase()
  if (s === 'started') return 'Running'
  if (s === 'stopped') return 'Stopped'
  if (s === 'starting' || s === 'stopping') return state
  if (s === 'error' || s === 'build_failed') return 'Error'
  if (s === 'archived' || s === 'archiving') return state
  if (s === 'destroyed' || s === 'destroying') return 'Destroyed'
  return state
}

function stateVariant(
  state: string | undefined,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!state) return 'secondary'
  const s = state.toLowerCase()
  if (s === 'started') return 'default'
  if (s === 'stopped') return 'secondary'
  if (s === 'error' || s === 'build_failed' || s === 'destroyed') return 'destructive'
  return 'outline'
}

function formatIntervalMinutes(minutes: number | undefined): string {
  if (minutes === undefined) return 'Disabled'
  if (minutes === 0) return 'On stop'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) return mins ? `${hours}h ${mins}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const h = hours % 24
  return h ? `${days}d ${h}h` : `${days}d`
}

export interface SandboxDetailsSheetProps {
  sandbox: SandboxItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getRegionName: (regionId: string) => string | undefined
  onStart: (id: string) => void
  onStop: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onRecover: (id: string) => void
  actionLoading?: Record<string, boolean>
}

export function SandboxDetailsSheet({
  sandbox,
  open,
  onOpenChange,
  getRegionName,
  onStart,
  onStop,
  onArchive,
  onDelete,
  onRecover,
  actionLoading = {},
}: SandboxDetailsSheetProps) {
  if (!sandbox) return null

  const id = sandbox.id
  const state = (sandbox.state ?? '').toLowerCase()
  const loading = actionLoading[id]
  const displayName = sandbox.name || sandbox.id

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        close={false}
        className="w-full sm:max-w-[800px] p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="flex flex-row justify-between items-center p-4 px-5 border-b border-border shrink-0">
          <SheetTitle className="text-2xl font-medium">Sandbox Details</SheetTitle>
          <div className="flex gap-2 items-center">
            {state === 'started' && (
              <Button variant="outline" size="sm" onClick={() => onStop(id)} disabled={loading}>
                Stop
              </Button>
            )}
            {(state === 'stopped' || state === 'archived') && (
              <Button variant="outline" size="sm" onClick={() => onStart(id)} disabled={loading}>
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {(state === 'error' || state === 'build_failed') && sandbox.recoverable && (
              <Button variant="outline" size="sm" onClick={() => onRecover(id)} disabled={loading}>
                <Wrench className="w-4 h-4 mr-1" />
                Recover
              </Button>
            )}
            {state === 'stopped' && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onArchive(id)}
                disabled={loading}
              >
                <Archive className="w-4 h-4" />
              </Button>
            )}
            {!['destroyed', 'destroying'].includes(state) && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(id)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-10 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm text-muted-foreground">Name</h3>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <CopyButton value={displayName} />
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground">ID</h3>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm font-mono truncate">{sandbox.id}</p>
                <CopyButton value={sandbox.id} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm text-muted-foreground">State</h3>
              <div className="mt-1 text-sm">
                <Badge variant={stateVariant(sandbox.state)}>{stateLabel(sandbox.state)}</Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground">Snapshot</h3>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm font-medium truncate">{sandbox.snapshot ?? '—'}</p>
                {sandbox.snapshot && <CopyButton value={sandbox.snapshot} />}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground">Region</h3>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {getRegionName(sandbox.regionId) ?? sandbox.regionId}
                </p>
                <CopyButton value={sandbox.regionId} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm text-muted-foreground">Last event</h3>
              <p className="mt-1 text-sm font-medium">
                {sandbox.updatedAt
                  ? formatDistanceToNow(new Date(sandbox.updatedAt), { addSuffix: true })
                  : '—'}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground">Created at</h3>
              <p className="mt-1 text-sm font-medium">
                {sandbox.createdAt ? format(new Date(sandbox.createdAt), 'PPp') : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm text-muted-foreground">Auto-stop</h3>
              <p className="mt-1 text-sm font-medium">
                {sandbox.autoStopInterval !== undefined && sandbox.autoStopInterval > 0
                  ? formatIntervalMinutes(sandbox.autoStopInterval)
                  : 'Disabled'}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground">Auto-archive</h3>
              <p className="mt-1 text-sm font-medium">
                {sandbox.autoArchiveInterval !== undefined && sandbox.autoArchiveInterval > 0
                  ? formatIntervalMinutes(sandbox.autoArchiveInterval)
                  : 'Disabled'}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground">Auto-delete</h3>
              <p className="mt-1 text-sm font-medium">
                {sandbox.autoDeleteInterval !== undefined && sandbox.autoDeleteInterval >= 0
                  ? formatIntervalMinutes(sandbox.autoDeleteInterval)
                  : 'Disabled'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground">Resources</h3>
            <div className="mt-1 text-sm font-medium flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/80 px-2 py-0.5">
                {sandbox.cpu} vCPU
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/80 px-2 py-0.5">
                {sandbox.memory} GiB
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/80 px-2 py-0.5">
                {sandbox.disk} GiB
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Labels</h3>
            <div className="mt-3 space-y-4">
              {Object.keys(sandbox.labels).length > 0 ? (
                Object.entries(sandbox.labels).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <div>{key}</div>
                    <div className="font-medium p-2 bg-muted rounded-md mt-1 border border-border">
                      {value}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col border border-border rounded-md items-center justify-center gap-2 text-muted-foreground w-full min-h-[100px]">
                  <span className="text-sm">No labels</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
