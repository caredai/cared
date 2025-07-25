import type { SummarySettings } from '../settings'
import type { ReducedMessage } from '../types'

export function getLatestSummary(messages: ReducedMessage[]) {
  if (messages.length < 2) {
    return
  }
  // Start from the second last message, as the last one is usually the current user input
  for (let i = messages.length - 2; i >= 0; i--) {
    const message = messages[i]!
    const summary = message.content.metadata.summary?.trim()
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
