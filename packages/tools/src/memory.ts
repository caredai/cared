import { tool } from 'ai'
import { z } from 'zod'

import { and, eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { AgentVersion, AppVersion, Chat, Memory } from '@mindworld/db/schema'
import { getTextEmbeddingModelInfo } from '@mindworld/providers'
import { embed } from '@mindworld/providers/embed'
import { CohereReranker } from '@mindworld/providers/rerank'
import { QdrantVector } from '@mindworld/vdb'

import type { Context } from './context'

/**
 * Get the embedding model based on scope priority:
 * - For 'app' scope: Agent > App
 * - For 'chat' scope: Chat > Agent > App
 */
async function getEmbeddingModel(ctx: Context, scope: 'chat' | 'app') {
  // Get chat info if needed for chat scope
  const chat =
    scope === 'chat'
      ? await db.query.Chat.findFirst({
          where: eq(Chat.id, ctx.chatId),
        })
      : null

  if (scope === 'chat' && chat?.metadata.embeddingModel) {
    return chat.metadata.embeddingModel
  }

  // Get agent version info
  const agentVersion = await db.query.AgentVersion.findFirst({
    where: and(eq(AgentVersion.agentId, ctx.agentId), eq(AgentVersion.version, ctx.version)),
  })

  if (agentVersion?.metadata.embeddingModel) {
    return agentVersion.metadata.embeddingModel
  }

  // Get app version info
  const appVersion = await db.query.AppVersion.findFirst({
    where: and(eq(AppVersion.appId, ctx.appId), eq(AppVersion.version, ctx.version)),
  })

  return appVersion?.metadata.embeddingModel
}

function storeMemory(ctx: Context) {
  return tool({
    description:
      'Store a new memory into the long-term memory database. This tool allows you to save important information or knowledge about the user, which can be retrieved later. If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.',
    parameters: z.object({
      content: z.string().describe('The memory content to add to the long-term memory database'),
      scope: z
        .enum(['chat', 'app'])
        .describe(
          'The scope of the memory. Use "chat" for conversation-specific memories that are only relevant to the current chat. Use "app" for memories that should be accessible across all chats within the same app.',
        ),
    }),
    execute: async ({ content, scope }) => {
      const embeddingModel = await getEmbeddingModel(ctx, scope)
      if (!embeddingModel) {
        return
      }

      const modelInfo = getTextEmbeddingModelInfo(embeddingModel)
      if (!modelInfo?.dimensions) {
        return
      }

      const id = (
        await db
          .insert(Memory)
          .values({
            userId: ctx.userId,
            appId: ctx.appId,
            chatId: scope === 'chat' ? ctx.chatId : undefined,
            content,
          })
          .returning()
      ).at(0)?.id
      if (!id) {
        return
      }

      const embeddings = await embed([content], embeddingModel)
      const embedding = embeddings.at(0)
      if (!embedding) {
        return
      }

      const vdb = new QdrantVector(modelInfo.dimensions)
      await vdb.insertMemories({
        id,
        content,
        embedding,
        metadata: {
          userId: ctx.userId,
          appId: ctx.appId,
          chatId: scope === 'chat' ? ctx.chatId : undefined,
          scope,
        },
      })
    },
  })
}

function retrieveMemory(ctx: Context) {
  return tool({
    description:
      'Retrieve memories from the long-term memory database based on specified criteria. You can search for memories associated with the user. This tool helps you access previously stored information to maintain context and provide more relevant responses.',
    parameters: z.object({
      query: z.string().describe('The query to search for in the long-term memory database'),
      scope: z
        .enum(['chat', 'app'])
        .describe(
          'The scope of memories to search. Use "chat" to only search memories from current chat, "app" to search both app-scoped memories and chat-scoped memories.',
        ),
    }),
    execute: async ({ query, scope }) => {
      const embeddingModel = await getEmbeddingModel(ctx, scope)
      if (!embeddingModel) {
        return []
      }

      const modelInfo = getTextEmbeddingModelInfo(embeddingModel)
      if (!modelInfo?.dimensions) {
        return []
      }

      const embeddings = await embed([query], embeddingModel)
      const embedding = embeddings.at(0)
      if (!embedding) {
        return []
      }

      const vdb = new QdrantVector(modelInfo.dimensions)

      const filter = {
        userId: ctx.userId,
        appId: ctx.appId,
        chatId: scope === 'chat' ? ctx.chatId : undefined,
      }

      const memories = await vdb.searchMemoriesByEmbedding(embedding, filter)
      const reranker = new CohereReranker()
      const result = await reranker.rerank(
        query,
        memories.map((memory) => memory.content),
      )
      return result.documents
    },
  })
}

export const memoryTools = {
  storeMemory,
  retrieveMemory,
}
