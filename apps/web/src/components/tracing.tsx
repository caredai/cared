'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { formatDistance } from 'date-fns'
import {
  Activity,
  Bot,
  Box,
  CircleQuestionMarkIcon,
  ClockIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from 'lucide-react'

import { Button } from '@cared/ui/components/button'
import { DataTable } from '@cared/ui/components/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { RefreshCwSpinner, Spinner } from '@cared/ui/components/spinner'
import { cn } from '@cared/ui/lib/utils'

import type { TraceWithDetails } from '@langfuse/core'
import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import { PopoverTooltip } from '@/components/tooltip'
import { useApps } from '@/hooks/use-app'
import { useTraces } from '@/hooks/use-telemetry'
import { useWorkspaces } from '@/hooks/use-workspace'

type TraceScope = 'user' | 'organization' | 'workspace' | 'app'

export function TracingWithSelector({
  scope,
  organizationId,
  workspaceId,
  appId,
}: {
  scope: TraceScope
  organizationId?: string
  workspaceId?: string
  appId?: string
}) {
  // State for scope switching
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('none')
  const [selectedAppId, setSelectedAppId] = useState<string>('none')

  // Handle workspace selection change - reset app selection when workspace is cleared
  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId)
    setSelectedAppId('none') // Reset app selection when workspace is cleared
  }

  // Determine effective scope and IDs based on user selection
  // Priority: app > workspace > original scope
  const effectiveScope = useMemo(() => {
    if (selectedAppId !== 'none') return 'app'
    if (selectedWorkspaceId !== 'none') return 'workspace'
    return scope
  }, [selectedAppId, selectedWorkspaceId, scope])

  // Use selected IDs if available, otherwise fall back to props
  const effectiveOrganizationId = organizationId
  const effectiveWorkspaceId = selectedWorkspaceId !== 'none' ? selectedWorkspaceId : workspaceId
  const effectiveAppId = selectedAppId !== 'none' ? selectedAppId : appId

  // Get workspaces and apps for scope switching
  const workspaces = useWorkspaces(effectiveOrganizationId)
  const apps = useApps({ workspaceId: effectiveWorkspaceId })

  return (
    <TracingInner
      scope={effectiveScope}
      organizationId={effectiveOrganizationId}
      workspaceId={effectiveWorkspaceId}
      appId={effectiveAppId}
      selector={
        <>
          {/* Workspace selector - only show for organization scope */}
          {scope === 'organization' && (
            <WorkspaceSelector
              value={selectedWorkspaceId}
              onValueChange={handleWorkspaceChange}
              workspaces={workspaces}
            />
          )}

          {/* App selector - show for organization scope when workspace is selected, or for workspace scope */}
          {(scope === 'organization' && effectiveWorkspaceId) || scope === 'workspace' ? (
            <AppSelector value={selectedAppId} onValueChange={setSelectedAppId} apps={apps} />
          ) : null}

          <PopoverTooltip
            icon={CircleQuestionMarkIcon}
            className="inline-block align-bottom"
            side="right"
            align="start"
            content={
              <div className="space-y-2">
                <p className="text-sm">Use the selectors to filter traces by scope:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {scope === 'organization' && (
                    <>
                      <li>
                        <strong>Organization:</strong> Default scope when no workspace or app is
                        selected
                      </li>
                      <li>
                        <strong>Workspace:</strong> Select a workspace to view workspace-scoped
                        traces
                      </li>
                    </>
                  )}
                  {scope === 'workspace' && (
                    <li>
                      <strong>Workspace:</strong> Default scope when no app is selected
                    </li>
                  )}
                  <li>
                    <strong>App:</strong> Select an app to view app-scoped traces
                  </li>
                </ul>
              </div>
            }
          />
        </>
      }
    />
  )
}

export function Tracing({
  scope,
  organizationId,
  workspaceId,
  appId,
}: {
  scope: TraceScope
  organizationId?: string
  workspaceId?: string
  appId?: string
}) {
  return (
    <TracingInner
      scope={scope}
      organizationId={organizationId}
      workspaceId={workspaceId}
      appId={appId}
    />
  )
}

function TracingInner({
  scope,
  organizationId,
  workspaceId,
  appId,
  selector,
}: {
  scope: TraceScope
  organizationId?: string
  workspaceId?: string
  appId?: string
  selector?: ReactNode
}) {
  const [pageSize, setPageSize] = useState(20)
  const [dateRange, setDateRange] = useState<string>('7d')

  // Calculate date range filters
  const dateRangeFilters = useMemo(() => {
    const now = new Date()
    let fromTimestamp: string | undefined

    switch (dateRange) {
      case '30m':
        fromTimestamp = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
        break
      case '1h':
        fromTimestamp = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
        break
      case '6h':
        fromTimestamp = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
        break
      case '1d':
        fromTimestamp = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        break
      case '3d':
        fromTimestamp = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '7d':
        fromTimestamp = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        fromTimestamp = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '90d':
        fromTimestamp = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        fromTimestamp = undefined
    }

    return { fromTimestamp }
  }, [dateRange])

  const { traces, isLoading, isFetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTraces({
      userId: scope === 'user' ? undefined : undefined, // Will be handled by auth context
      organizationId: scope === 'organization' ? organizationId : undefined,
      workspaceId: scope === 'workspace' ? workspaceId : undefined,
      appId: scope === 'app' ? appId : undefined,
      pageSize,
      ...dateRangeFilters,
    })

  // Define table columns
  const columns: ColumnDef<TraceWithDetails>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {formatDistance(new Date(trace.timestamp), new Date(), { addSuffix: true })}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(trace.timestamp).toLocaleString()}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <div className="flex flex-col max-w-50">
            <span className="font-medium truncate">{trace.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'latency',
      header: 'Latency',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{trace.latency ? `${trace.latency}s` : 'N/A'}</span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const trace = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open trace details in new tab or modal
                window.open(`/traces/${trace.id}`, '_blank')
              }}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              View
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <SectionTitle title="Tracing" description={getScopeDescription(scope)} />

      <div>
        <div className="w-full flex flex-wrap items-center gap-2">
          {selector}

          <div className="lg:ml-auto flex items-center gap-2">
            {/* Date range filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30m">Last 30m</SelectItem>
                <SelectItem value="1h">Last 1h</SelectItem>
                <SelectItem value="6h">Last 6h</SelectItem>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="3d">Last 3 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
              {!isLoading && isFetching ? (
                <RefreshCwSpinner className="h-4 w-4" />
              ) : (
                <RefreshCwIcon className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : traces.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 mt-8 py-8 border rounded-md">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No traces found</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={traces}
              enableInfiniteScroll={true}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onFetchNextPage={fetchNextPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              className="text-muted-foreground"
            />
          </>
        )}
      </div>
    </>
  )
}

// Helper function to get description based on scope
function getScopeDescription(scope: TraceScope): string {
  return `Monitor and analyze trace data for your ${scope === 'user' ? 'account' : scope}`
}

// Workspace selector component
function WorkspaceSelector({
  value,
  onValueChange,
  workspaces,
}: {
  value: string
  onValueChange: (value: string) => void
  workspaces: { id: string; name: string }[]
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn('w-full sm:w-auto', value === 'none' && 'w-full')}>
        <SelectValue placeholder="Select workspace">
          <div className="flex items-center gap-2 pr-2">
            <Box className="size-4 text-muted-foreground/70" />
            <span className={cn('flex-1 truncate', value === 'none' && 'text-muted-foreground/70')}>
              {value !== 'none' ? workspaces.find((w) => w.id === value)?.name : '--'}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-muted-foreground/70" />
            <span>-- None --</span>
          </div>
        </SelectItem>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            <div className="flex items-center gap-2">
              <Box className="size-4 text-muted-foreground/70" />
              {workspace.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// App selector component
function AppSelector({
  value,
  onValueChange,
  apps,
}: {
  value: string
  onValueChange: (value: string) => void
  apps: { app: { id: string; name: string } }[]
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full sm:w-auto">
        <SelectValue placeholder="Select app">
          <div className="flex items-center gap-2 pr-2">
            <Bot className="size-4 text-muted-foreground/70" />
            <span className={cn('flex-1 truncate', value === 'none' && 'text-muted-foreground/70')}>
              {value !== 'none' ? apps.find((a) => a.app.id === value)?.app.name : '--'}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-muted-foreground/70" />
            <span>-- None --</span>
          </div>
        </SelectItem>
        {apps.map((app) => (
          <SelectItem key={app.app.id} value={app.app.id}>
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-muted-foreground/70" />
              {app.app.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
