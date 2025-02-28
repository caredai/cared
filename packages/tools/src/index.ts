import type { Tool } from 'ai'

import type { Context, ContextAwareTool } from './context'

export * from './context'
export * from './memory'
export * from './knowledge'
export * from './artifact'

export function buildTools(context: Context, tools: Record<string, ContextAwareTool>) {
  const result: Record<string, Tool> = {}
  for (const [name, tool] of Object.entries(tools)) {
    result[name] = tool(context)
  }
  return result
}
