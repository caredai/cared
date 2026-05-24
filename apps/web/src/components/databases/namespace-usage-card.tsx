import { format } from 'date-fns'
import { Info } from 'lucide-react'

import type { RouterOutputs } from '@cared/api'
import type { DatabaseNamespaceUsageLimits } from '@cared/api/types'
import { Card, CardContent } from '@cared/ui/components/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@cared/ui/components/tooltip'

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

interface UsageMetricProps {
  label: string
  value: string
  tooltip: string
}

function UsageMetric({ label, value, tooltip }: UsageMetricProps) {
  return (
    <div className="flex flex-1 flex-col gap-1 min-w-0 px-5 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
        <span>{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 cursor-default opacity-60" />
          </TooltipTrigger>
          <TooltipContent className="max-w-56 text-center">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <UsageMetric
            label="Branches"
            value={`${branchCount} / ${usageLimits.maxBranches}`}
            tooltip="Number of branches in this namespace"
          />
          <div className="hidden lg:block w-px self-stretch bg-border shrink-0" />
          <UsageMetric
            label="Compute"
            value={`${formatCuHours(computeUsed)} / ${usageLimits.maxComputeCuHours} CU-hrs`}
            tooltip="Total compute time usage for this namespace"
          />
          <div className="hidden lg:block w-px self-stretch bg-border shrink-0" />
          <UsageMetric
            label="Storage"
            value={`${formatStorageBytes(storageUsed)} / ${formatStorageBytes(usageLimits.maxStorageBytes)}`}
            tooltip="Total storage usage for this namespace"
          />
          <div className="hidden lg:block w-px self-stretch bg-border shrink-0" />
          <UsageMetric
            label="Network transfer"
            value={`${formatStorageBytes(networkUsed)} / ${formatStorageBytes(usageLimits.maxDataTransferBytes)}`}
            tooltip="Total network data transfer for this namespace"
          />
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Usage since {periodStart}. Metrics may be delayed by an hour and are not updated for
            inactive namespace.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
