import type { Tool } from 'ai'

export type Context = {
  userId: string
} & (
  | {
      agentId: string
      chatId: string
    }
  | {
      roomId: string
    }
)

export type ContextAwareTool = (context: Context) => Tool
