import type { Tool } from 'ai'

export interface Context {
  userId: string
  appId: string
  agentId: string
  chatId: string
}

export type ContextAwareTool = (context: Context) => Tool
