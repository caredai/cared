import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Switch } from '@cared/ui/components/switch'
import { cn } from '@cared/ui/lib/utils'

import type { DatabaseBranch, DatabaseEndpoint } from '@/hooks/use-database'
import { orpc } from '@/lib/orpc'
import {
  endpointStateLabel,
  endpointStateVariant,
  formatComputeRange,
} from './database-format'

interface ConnectDialogProps {
  namespaceId: string
  branches: DatabaseBranch[]
  endpoints: DatabaseEndpoint[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Derives the PgBouncer pooler hostname from a direct endpoint hostname. */
function derivePoolerHost(directHost: string): string {
  // Neon format: ep-name.region.aws.neon.tech -> ep-name-pooler.region.aws.neon.tech
  return directHost.replace(/^(ep-[^.]+)\./, '$1-pooler.')
}

/** Builds a connection URI string with the password masked or revealed. */
function buildConnectionUri({
  host,
  database,
  role,
  password,
  pooling,
}: {
  host: string
  database: string
  role: string
  password: string
  pooling: boolean
}): string {
  const displayHost = pooling ? derivePoolerHost(host) : host
  const base = `postgresql://${role}:${password}@${displayHost}/${database}`
  const params = pooling
    ? 'sslmode=require&channel_binding=require'
    : 'sslmode=require'
  return `${base}?${params}`
}

const MASKED_PASSWORD = '**************'

/** Finds the primary (read-write) endpoint for a branch, or falls back to first. */
function getPrimaryEndpoint(
  endpoints: DatabaseEndpoint[],
  branchId: string,
): DatabaseEndpoint | undefined {
  return (
    endpoints.find((ep) => ep.branchId === branchId && ep.type === 'read_write') ??
    endpoints.find((ep) => ep.branchId === branchId)
  )
}

function endpointDisplayName(ep: DatabaseEndpoint): string {
  return ep.name?.trim() || (ep.type === 'read_write' ? 'Primary' : 'Compute')
}

/** Inner panel that loads databases/roles for the selected branch. */
function ConnectDialogBody({
  namespaceId,
  branches,
  endpoints,
}: Omit<ConnectDialogProps, 'open' | 'onOpenChange'>) {
  const defaultBranch = branches.find((b) => b.default) ?? branches[0]

  const [branchId, setBranchId] = useState(defaultBranch?.id ?? '')
  const [endpointId, setEndpointId] = useState('')
  const [database, setDatabase] = useState('')
  const [role, setRole] = useState('')
  const [pooling, setPooling] = useState(true)
  const [passwordRevealed, setPasswordRevealed] = useState(false)

  const branchEndpoints = useMemo(
    () => endpoints.filter((ep) => ep.branchId === branchId),
    [endpoints, branchId],
  )

  // Reset endpoint when branch changes
  useEffect(() => {
    const primary = getPrimaryEndpoint(endpoints, branchId)
    setEndpointId(primary?.id ?? '')
    setDatabase('')
    setRole('')
    setPasswordRevealed(false)
  }, [branchId, endpoints])

  const selectedEndpoint = endpoints.find((ep) => ep.id === endpointId)

  const { data: dbsData } = useQuery({
    ...orpc.account.database.listDatabases.queryOptions({
      input: { namespaceId, branchId },
    }),
    enabled: Boolean(branchId),
  })
  const databases = dbsData?.databases ?? []

  const { data: rolesData } = useQuery({
    ...orpc.account.database.listRoles.queryOptions({
      input: { namespaceId, branchId },
    }),
    enabled: Boolean(branchId),
  })
  const roles = rolesData?.roles ?? []

  // Default database to the first one when list loads
  useEffect(() => {
    if (!database && databases.length > 0) {
      setDatabase(databases[0]?.name ?? '')
    }
  }, [database, databases])

  // Default role to the database owner when database changes
  useEffect(() => {
    if (!role && databases.length > 0) {
      const db = databases.find((d) => d.name === database) ?? databases[0]
      if (db) {
        setRole(db.ownerName)
        setDatabase(db.name)
      }
    }
  }, [role, database, databases])

  // Fetch connection URIs for the selected branch to retrieve the password
  const { data: uriData, isFetching: isFetchingUri } = useQuery({
    ...orpc.account.database.listConnectionUris.queryOptions({
      input: { namespaceId, branchId },
    }),
    enabled: Boolean(branchId),
  })

  // Resolve the actual connection URI for the selected database
  const resolvedUri = useMemo(() => {
    if (!uriData?.connectionUris.length) return null
    return uriData.connectionUris.find((u) => u.name === database) ?? uriData.connectionUris[0]
  }, [uriData, database])

  // Parse the password from the resolved URI
  const actualPassword = useMemo(() => {
    if (!resolvedUri?.url) return null
    try {
      const url = new URL(resolvedUri.url)
      return url.password || null
    } catch {
      return null
    }
  }, [resolvedUri])

  const host = selectedEndpoint?.host ?? ''
  const displayPassword = passwordRevealed && actualPassword ? actualPassword : MASKED_PASSWORD

  const connectionString = host
    ? buildConnectionUri({ host, database, role, password: displayPassword, pooling })
    : ''

  const handleCopy = () => {
    if (!host || !database || !role) {
      toast.error('Select branch, database, and role first')
      return
    }
    // Copy with actual password if available, otherwise masked
    const toCopy = actualPassword
      ? buildConnectionUri({ host, database, role, password: actualPassword, pooling })
      : connectionString
    void navigator.clipboard.writeText(toCopy).then(() => {
      toast.success('Connection string copied')
    })
  }

  return (
    <div className="space-y-5 pt-1">
      {/* Selectors row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select value={branchId} onValueChange={setBranchId} disabled={branches.length === 0}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <span>{b.name}</span>
                  {b.default && (
                    <span className="ml-1.5 text-muted-foreground text-xs">Default</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Compute</Label>
          <Select
            value={endpointId}
            onValueChange={(v) => {
              setEndpointId(v)
              setPasswordRevealed(false)
            }}
            disabled={branchEndpoints.length === 0}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Compute" />
            </SelectTrigger>
            <SelectContent>
              {branchEndpoints.map((ep) => (
                <SelectItem key={ep.id} value={ep.id}>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full shrink-0',
                        ep.currentState === 'active' ? 'bg-green-500' : 'bg-muted-foreground',
                      )}
                    />
                    {endpointDisplayName(ep)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Database</Label>
          </div>
          <Select value={database} onValueChange={setDatabase} disabled={databases.length === 0}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Database" />
            </SelectTrigger>
            <SelectContent>
              {databases.map((db) => (
                <SelectItem key={db.name} value={db.name}>
                  {db.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
            >
              Reset password
            </button>
          </div>
          <Select value={role} onValueChange={setRole} disabled={roles.length === 0}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.name} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Endpoint state badge */}
      {selectedEndpoint && (
        <div className="flex items-center gap-2">
          <Badge
            variant={endpointStateVariant(selectedEndpoint.currentState)}
            className="text-xs font-normal"
          >
            <span
              className={cn(
                'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
                selectedEndpoint.currentState === 'active'
                  ? 'bg-green-500'
                  : 'bg-muted-foreground/60',
              )}
            />
            {formatComputeRange(
              selectedEndpoint.autoscalingLimitMinCu,
              selectedEndpoint.autoscalingLimitMaxCu,
            )}{' '}
            · {endpointStateLabel(selectedEndpoint.currentState)}
          </Badge>
        </div>
      )}

      {/* Connection string */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Connection string</span>
          <Label
            htmlFor="connect-pooling-toggle"
            className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground font-normal"
          >
            <Switch
              id="connect-pooling-toggle"
              checked={pooling}
              onCheckedChange={setPooling}
              className="scale-90"
            />
            Connection pooling
          </Label>
        </div>

        <div
          className={cn(
            'relative rounded-md border bg-muted/40 px-3 py-2.5',
            'font-mono text-xs text-foreground leading-relaxed',
            'break-all',
          )}
        >
          {isFetchingUri ? (
            <span className="text-muted-foreground animate-pulse">Loading…</span>
          ) : connectionString ? (
            connectionString
          ) : (
            <span className="text-muted-foreground">Select branch and compute to generate</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleCopy}
            disabled={!connectionString || isFetchingUri}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy snippet
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setPasswordRevealed((prev) => !prev)}
            disabled={!actualPassword || isFetchingUri}
          >
            {passwordRevealed ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {passwordRevealed ? 'Hide password' : 'Show password'}
          </Button>
          {isFetchingUri && (
            <RotateCcw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your password is saved in a secure storage vault.
      </p>
    </div>
  )
}

export function ConnectDialog({
  namespaceId,
  branches,
  endpoints,
  open,
  onOpenChange,
}: ConnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Connect to your database</DialogTitle>
        </DialogHeader>
        <ConnectDialogBody
          namespaceId={namespaceId}
          branches={branches}
          endpoints={endpoints}
        />
      </DialogContent>
    </Dialog>
  )
}
