import type { SummarySettings } from '../settings'
import type { ReducedMessage } from '../types'

export function getLatestSummary(messages: ReducedMessage[], ignoreExcluded = false) {
  if (messages.length < 2) {
    return
  }
  // Start from the second last message, as the last one is usually the current user input
  for (let i = messages.length - 2; i >= 0; i--) {
    const metadata = messages[i]!.content.metadata
    if (ignoreExcluded && metadata.excluded) {
      continue
    }
    const summary = metadata.summary?.trim()
    if (summary) {
      return {
        summary,
        position: i,
      }
    }
  }
}

export function formatSummary(
  summary: string,
  settings: SummarySettings,
  substituteMacros: (content: string, additionalMacro?: Record<string, string>) => string,
) {
  if (settings.injectionTemplate) {
    return substituteMacros(settings.injectionTemplate, {
      summary,
    })
  } else {
    return `Summary: ${summary}`
  }
}
