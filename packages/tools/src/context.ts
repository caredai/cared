import type { UIMessageStreamWriter , Tool } from 'ai'

import type { Agent, App, Chat } from '@ownxai/db/schema'
import { getModel } from '@ownxai/providers/providers'

export interface Context {
  userId: string
  appId: string
  preview?: boolean
  agentId: string
  chatId: string

  app: App
  agent: Agent
  chat: Chat

  dataStream?: UIMessageStreamWriter
}

export type ContextAwareTool = (context: Context) => Tool

export function getLanguageModelFromContext(ctx: Context) {
  return getModel(
    ctx.chat.metadata.languageModel ??
      ctx.agent.metadata.languageModel ??
      ctx.app.metadata.languageModel,
    'language',
  )
}

export function getImageModelFromContext(ctx: Context) {
  return getModel(
    ctx.chat.metadata.imageModel ?? ctx.agent.metadata.imageModel ?? ctx.app.metadata.imageModel,
    'image',
  )
}
