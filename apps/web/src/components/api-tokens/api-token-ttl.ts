import { addDays, addYears } from 'date-fns'

export type TtlPreset = 'none' | '7d' | '30d' | '90d' | '1y' | 'custom'

export type TtlCustomRange = {
  from?: Date
  to?: Date
}

export const TTL_PRESET_OPTIONS: { value: TtlPreset; label: string }[] = [
  { value: 'none', label: 'No expiration' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
  { value: 'custom', label: 'Custom' },
]

const PRESET_DAY_COUNTS: Record<Exclude<TtlPreset, 'none' | 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
}

/** Map preset + optional custom range to API token TTL fields. */
export function ttlPresetToExpiry(
  preset: TtlPreset,
  customRange?: TtlCustomRange,
): { notBefore?: Date; expiresAt?: Date } | undefined {
  if (preset === 'none') {
    return undefined
  }

  if (preset === 'custom') {
    if (!customRange?.to) {
      return customRange?.from ? { notBefore: customRange.from } : undefined
    }
    return {
      notBefore: customRange.from,
      expiresAt: customRange.to,
    }
  }

  const now = new Date()
  if (preset === '1y') {
    return { expiresAt: addYears(now, 1) }
  }

  return { expiresAt: addDays(now, PRESET_DAY_COUNTS[preset]) }
}

/** Infer preset from stored token TTL for edit forms. */
export function detectTtlPreset(
  notBefore?: Date | null,
  expiresAt?: Date | null,
): TtlPreset {
  if (!notBefore && !expiresAt) {
    return 'none'
  }

  if (notBefore) {
    return 'custom'
  }

  if (!expiresAt) {
    return 'none'
  }

  const msUntilExpiry = expiresAt.getTime() - Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  for (const [preset, days] of Object.entries(PRESET_DAY_COUNTS) as [
    Exclude<TtlPreset, 'none' | 'custom'>,
    number,
  ][]) {
    const targetMs = days * dayMs
    if (Math.abs(msUntilExpiry - targetMs) <= 2 * dayMs) {
      return preset
    }
  }

  return 'custom'
}
