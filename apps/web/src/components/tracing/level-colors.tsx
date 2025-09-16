import type { ObservationLevel } from '@langfuse/core'

export const LevelColors = {
  DEFAULT: { text: '', bg: '' },
  DEBUG: { text: 'text-muted-foreground', bg: 'bg-primary-foreground' },
  WARNING: { text: 'text-yellow-800', bg: 'bg-yellow-200' },
  ERROR: { text: 'text-red-800', bg: 'bg-red-200' },
}

export const LevelSymbols = {
  DEFAULT: 'ℹ️',
  DEBUG: '🔍',
  WARNING: '⚠️',
  ERROR: '🚨',
}

export const formatAsLabel = (countLabel: string) => {
  return countLabel.replace(/Count$/, '').toUpperCase() as ObservationLevel
}
