import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronRight, GitBranch } from 'lucide-react'

import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import { DataTable } from '@cared/ui/components/data-table'

import type { DatabaseBranch, DatabaseEndpoint } from '@/hooks/use-database'
import type { ColumnDef } from '@tanstack/react-table'
import { SectionTitle } from '@/components/section'
import {
  useDatabaseBranchCount,
  useDatabaseEndpoints,
  useDatabaseNamespace,
  useNamespaceUsageLimits,
} from '@/hooks/use-database'
import { orpc } from '@/lib/orpc'
import {
  endpointStateLabel,
  endpointStateVariant,
  formatComputeRange,
  formatHistoryRetention,
  RelativeTime,
} from './database-format'
import { ConnectDialog } from './connect-dialog'
import { NamespaceMonitoringPanel } from './namespace-monitoring-panel'
import { NamespaceUsageCard } from './namespace-usage-card'
import { formatDatabaseRegion } from './region-label'

interface NamespaceDashboardProps {
  namespaceId: string
  accountIdNoPrefix: string
  namespaceIdNoPrefix: string
}

function getPrimaryEndpoint(
  endpoints: DatabaseEndpoint[],
  branchId: string,
): DatabaseEndpoint | undefined {
  return (
    endpoints.find((ep) => ep.branchId === branchId && ep.type === 'read_write') ??
    endpoints.find((ep) => ep.branchId === branchId)
  )
}

export function NamespaceDashboard({
  namespaceId,
  accountIdNoPrefix,
  namespaceIdNoPrefix,
}: NamespaceDashboardProps) {
  const routeParams = { accountIdNoPrefix, namespaceIdNoPrefix }

  const namespace = useDatabaseNamespace(namespaceId)
  const branchCount = useDatabaseBranchCount(namespaceId)
  const endpoints = useDatabaseEndpoints(namespaceId)
  const usageLimits = useNamespaceUsageLimits(namespace)

  const [connectOpen, setConnectOpen] = useState(false)

  const {
    data: { branches },
  } = useSuspenseQuery(
    orpc.account.database.listBranches.queryOptions({
      input: { namespaceId, limit: 10 },
    }),
  )

  const defaultEndpoint = namespace.defaultEndpointSettings
  const minCu = defaultEndpoint?.autoscalingLimitMinCu ?? 0.25
  const maxCu = defaultEndpoint?.autoscalingLimitMaxCu ?? 2

  const branchColumns = useMemo<ColumnDef<DatabaseBranch, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const branch = row.original
          return (
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{branch.name}</span>
              {branch.default && (
                <Badge variant="secondary" className="text-xs font-normal">
                  Default
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: 'primary_compute',
        header: 'Primary compute',
        cell: ({ row }) => {
          const ep = getPrimaryEndpoint(endpoints, row.original.id)
          if (!ep) {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          return (
            <div className="flex items-center gap-2 text-sm">
              <span className="tabular-nums">
                {formatComputeRange(ep.autoscalingLimitMinCu, ep.autoscalingLimitMaxCu)}
              </span>
              <Badge variant={endpointStateVariant(ep.currentState)} className="text-xs">
                {endpointStateLabel(ep.currentState)}
              </Badge>
            </div>
          )
        },
      },
      {
        id: 'last_active',
        header: 'Compute last active',
        cell: ({ row }) => {
          const ep = getPrimaryEndpoint(endpoints, row.original.id)
          return <RelativeTime value={ep?.lastActive ?? ep?.suspendedAt} />
        },
      },
    ],
    [endpoints],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle title="Database dashboard" />
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <Button variant="default" size="sm" onClick={() => setConnectOpen(true)}>
            Connect
          </Button>
        </div>
      </div>

      <NamespaceUsageCard
        namespace={namespace}
        branchCount={branchCount}
        usageLimits={usageLimits}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">Monitoring</CardTitle>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link
                to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/monitoring"
                params={routeParams}
              >
                View all metrics
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pb-4">
            <NamespaceMonitoringPanel
              namespaceId={namespaceId}
              branches={branches}
              endpoints={endpoints}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                {branchCount} / {usageLimits.maxBranches} Branch
                {branchCount === 1 ? '' : 'es'}
              </CardTitle>
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <Link
                  to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/branches"
                  params={routeParams}
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={branchColumns} data={branches} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">Namespace settings</CardTitle>
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <Link
                  to="/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/settings"
                  params={routeParams}
                >
                  Manage
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingsRow label="Region" value={formatDatabaseRegion(namespace.regionId)} />
              <SettingsRow label="Default compute size" value={formatComputeRange(minCu, maxCu)} />
              <SettingsRow
                label="History retention"
                value={formatHistoryRetention(namespace.historyRetentionSeconds)}
              />
              <SettingsRow label="Postgres version" value={String(namespace.pgVersion)} />
              {namespace.isLowCost && (
                <CardDescription className="pt-2">
                  To extend the compute size limit, upgrade your plan.
                </CardDescription>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConnectDialog
        namespaceId={namespaceId}
        branches={branches}
        endpoints={endpoints}
        open={connectOpen}
        onOpenChange={setConnectOpen}
      />
    </div>
  )
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
