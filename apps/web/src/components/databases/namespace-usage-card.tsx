import { format } from 'date-fns'
import { Info } from 'lucide-react'

import type { RouterOutputs } from '@cared/api'
import type { DatabaseNamespaceUsageLimits } from '@cared/api/types'
import { Card, CardContent } from '@cared/ui/components/card'
import { Progress } from '@cared/ui/components/progress'

import { formatCuHours, formatStorageBytes } from './database-format'

type Namespace = RouterOutputs['account']['database']['getNamespace']['namespace']

interface NamespaceUsageCardProps {
  namespace: Pick<
    Namespace,
    'syntheticStorageSize' | 'activeTimeSeconds' | 'dataTransferBytes' | 'consumptionPeriodStart'
  >
  branchCount: number
  usageLimits: DatabaseNamespaceUsageLimits
}

function UsageMetric({
  label,
  value,
  limit,
  formatValue,
}: {
  label: string
  value: number
  limit: number
  formatValue: (v: number, max: number) => string
}) {
  const percent = limit > 0 ? Math.min((value / limit) * 100, 100) : 0

  return (
    <div className="flex flex-1 flex-col gap-2 min-w-0 px-4 first:pl-0 last:pr-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
          {formatValue(value, limit)}
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  )
}

export function NamespaceUsageCard({
  namespace,
  branchCount,
  usageLimits,
}: NamespaceUsageCardProps) {
  const storageUsed = namespace.syntheticStorageSize ?? 0
  const computeUsed = namespace.activeTimeSeconds
  const networkUsed = namespace.dataTransferBytes
  const periodStart = format(namespace.consumptionPeriodStart, 'MMM d, yyyy')

  return (
    <Card className="py-4">
      <CardContent className="px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <UsageMetric
            label="Branches"
            value={branchCount}
            limit={usageLimits.maxBranches}
            formatValue={(v, max) => `${v} / ${max}`}
          />
          <div className="hidden lg:block w-px h-10 bg-border shrink-0" />
          <UsageMetric
            label="Compute"
            value={computeUsed}
            limit={usageLimits.maxComputeCuHours * 3600}
            formatValue={(v) => `${formatCuHours(v)} / ${usageLimits.maxComputeCuHours} CU-hrs`}
          />
          <div className="hidden lg:block w-px h-10 bg-border shrink-0" />
          <UsageMetric
            label="Storage"
            value={storageUsed}
            limit={usageLimits.maxStorageBytes}
            formatValue={(v, max) => `${formatStorageBytes(v)} / ${formatStorageBytes(max)}`}
          />
          <div className="hidden lg:block w-px h-10 bg-border shrink-0" />
          <UsageMetric
            label="Network transfer"
            value={networkUsed}
            limit={usageLimits.maxDataTransferBytes}
            formatValue={(v, max) => `${formatStorageBytes(v)} / ${formatStorageBytes(max)}`}
          />
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Usage since {periodStart}. Metrics may be delayed by up to an hour.</span>
        </div>
      </CardContent>
    </Card>
  )
}
