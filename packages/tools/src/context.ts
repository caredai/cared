import type { Tool } from 'ai'

export interface Context {
  userId: string
  appId: string
  version: number
  agentId: string
  chatId: string
}

export type ContextAwareTool = (context: Context) => Tool
