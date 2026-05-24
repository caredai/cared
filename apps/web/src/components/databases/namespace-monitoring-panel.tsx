import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, GitBranch, RefreshCw } from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import { Label } from '@cared/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { cn } from '@cared/ui/lib/utils'

import type { DatabaseBranch, DatabaseEndpoint } from '@/hooks/use-database'
import { orpc } from '@/lib/orpc'
import { EndpointMonitoringChart } from './endpoint-monitoring-chart'

interface NamespaceMonitoringPanelProps {
  namespaceId: string
  branches: DatabaseBranch[]
  endpoints: DatabaseEndpoint[]
}

function endpointStateLabel(state: string): string {
  switch (state) {
    case 'active':
      return 'Active'
    case 'idle':
      return 'Idle'
    case 'init':
      return 'Starting'
    default:
      return state
  }
}

function getEndpointsForBranch(endpoints: DatabaseEndpoint[], branchId: string) {
  return endpoints.filter((ep) => ep.branchId === branchId)
}

function getPrimaryEndpoint(endpoints: DatabaseEndpoint[], branchId: string) {
  const branchEndpoints = getEndpointsForBranch(endpoints, branchId)
  return branchEndpoints.find((ep) => ep.type === 'read_write') ?? branchEndpoints[0]
}

export function NamespaceMonitoringPanel({
  namespaceId,
  branches,
  endpoints,
}: NamespaceMonitoringPanelProps) {
  const defaultBranch = branches.find((b) => b.default) ?? branches[0]
  const [branchId, setBranchId] = useState(defaultBranch?.id ?? '')
  const branchEndpoints = useMemo(
    () => (branchId ? getEndpointsForBranch(endpoints, branchId) : []),
    [endpoints, branchId],
  )
  const [endpointId, setEndpointId] = useState('')

  useEffect(() => {
    if (!branchId && defaultBranch?.id) {
      setBranchId(defaultBranch.id)
    }
  }, [branchId, defaultBranch?.id])

  useEffect(() => {
    const primary = branchId ? getPrimaryEndpoint(endpoints, branchId) : undefined
    if (primary) {
      setEndpointId(primary.id)
    }
  }, [branchId, endpoints])

  const selectedEndpoint = endpoints.find((ep) => ep.id === endpointId)

  const {
    data: stats,
    refetch,
    isFetching,
    isError,
  } = useQuery({
    ...orpc.account.database.getEndpointStats.queryOptions({
      input: {
        namespaceId,
        endpointId,
        grouping: '10min',
      },
    }),
    enabled: Boolean(endpointId),
  })

  const hasChartData = Boolean(
    stats?.points.some((p) => p.allocatedCu != null || p.ramBytes != null),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select value={branchId} onValueChange={setBranchId} disabled={branches.length === 0}>
            <SelectTrigger className="h-8">
              <div className="flex min-w-0 items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder="Branch" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <span>{branch.name}</span>
                  {branch.default && (
                    <span className="ml-1.5 text-muted-foreground text-xs">Default</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Compute</Label>
          <Select
            value={endpointId}
            onValueChange={setEndpointId}
            disabled={branchEndpoints.length === 0}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Compute" />
            </SelectTrigger>
            <SelectContent>
              {branchEndpoints.map((ep) => (
                <SelectItem key={ep.id} value={ep.id}>
                  {ep.name?.trim() || 'Primary'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEndpoint && (
          <Badge variant="outline" className="mb-0.5 font-normal h-8 px-2.5">
            <span
              className={cn(
                'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
                selectedEndpoint.currentState === 'active' ? 'bg-green-500' : 'bg-muted-foreground',
              )}
            />
            {endpointStateLabel(selectedEndpoint.currentState)}
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8"
          onClick={() => void refetch()}
          disabled={!endpointId || isFetching}
        >
          <RefreshCw className={cn('h-4 w-4 mr-1.5', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {isError && <p className="text-sm text-destructive">Failed to load monitoring metrics.</p>}

      {hasChartData && stats ? (
        <EndpointMonitoringChart points={stats.points} />
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border border-dashed',
            'py-16 text-center text-muted-foreground',
          )}
        >
          <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">
            {isFetching ? 'Loading metrics…' : 'There is no data to display at the moment.'}
          </p>
        </div>
      )}
    </div>
  )
}
