import { Badge } from '@cared/ui/components/badge'

export function StatusBadge({ status }: { status?: string | null }) {
  const value = status || 'unknown'
  const normalized = value.toLowerCase()
  const variant =
    normalized === 'ready' || normalized === 'completed'
      ? 'default'
      : normalized === 'failed'
        ? 'destructive'
        : normalized === 'pending' || normalized === 'waiting'
          ? 'secondary'
          : 'outline'

  return <Badge variant={variant}>{value}</Badge>
}

export function formatRegionCount(count: number) {
  return count === 1 ? '1 region' : `${count} regions`
}
