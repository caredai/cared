import { format, formatDistance } from 'date-fns'

import { cn } from '@cared/ui/lib/utils'

export const ABSOLUTE_TIME_FORMAT = 'MMM dd, yyyy hh:mm a'

/** Absolute timestamp with timezone offset, aligned with Neon console display. */
export function formatAbsoluteDateTime(value: string | Date): string {
  const date = new Date(value)
  const formatted = format(date, 'yyyy-MM-dd HH:mm:ss')
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hours = String(Math.floor(abs / 60)).padStart(2, '0')
  const minutes = String(abs % 60).padStart(2, '0')
  return `${formatted} ${sign}${hours}:${minutes}`
}

export function formatStorageBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  const decimals = unitIndex === 0 ? 0 : value >= 10 ? 0 : 2
  return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

export function formatCuHours(activeTimeSeconds: number): string {
  const hours = activeTimeSeconds / 3600
  if (hours < 0.01 && hours > 0) return '<0.01'
  return hours.toFixed(2)
}

export function formatComputeRange(minCu: number, maxCu: number): string {
  return `${minCu} ↔ ${maxCu} CU`
}

export function formatHistoryRetention(seconds: number): string {
  const hours = seconds / 3600
  if (hours === 0) return '0 hours'
  if (hours < 24) {
    return Number.isInteger(hours) ? `${hours} hours` : `${hours.toFixed(1)} hours`
  }
  const days = hours / 24
  return Number.isInteger(days) ? `${days} days` : `${days.toFixed(1)} days`
}

export function formatSuspendTimeout(seconds: number | undefined): string {
  if (seconds === -1) return 'Never'
  if (seconds === 0 || seconds === undefined) return '5 minutes (default)'
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  return `${Math.round(seconds / 86400)} days`
}

export function endpointStateLabel(state: string): string {
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

export function endpointStateVariant(state: string): 'default' | 'secondary' | 'outline' {
  switch (state) {
    case 'active':
      return 'default'
    case 'idle':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function RelativeTime({
  value,
  muted = true,
  className,
}: {
  value: string | Date | null | undefined
  muted?: boolean
  className?: string
}) {
  if (!value) {
    return <span className={cn('text-sm', muted && 'text-muted-foreground', className)}>—</span>
  }
  const date = new Date(value)
  return (
    <span
      className={cn('text-sm', muted && 'text-muted-foreground', className)}
      title={format(date, ABSOLUTE_TIME_FORMAT)}
    >
      {formatDistance(date, new Date(), { addSuffix: true })}
    </span>
  )
}
