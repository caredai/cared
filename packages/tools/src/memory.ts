import { tool } from 'ai'
import { z } from 'zod'

import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { Chat, Memory } from '@mindworld/db/schema'
import { getTextEmbeddingModelInfo } from '@mindworld/providers'
import { embed } from '@mindworld/providers/embed'
import { CohereReranker } from '@mindworld/providers/rerank'
import { QdrantVector } from '@mindworld/vdb'

import type { Context } from './context'

function addMemory(ctx: Context) {
  return tool({
    description:
      'Store a new memory into the long-term memory database. This tool allows you to save important information or knowledge about the user, which can be retrieved later. If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.',
    parameters: z.object({
      content: z.string().describe('the memory content to add to the long-term memory database'),
    }),
    execute: async ({ content }) => {
      if ('chatId' in ctx) {
        const chat = await db.query.Chat.findFirst({
          where: eq(Chat.id, ctx.chatId),
        })
        if (!chat) {
          return
        }
        const modelInfo = getTextEmbeddingModelInfo(chat.metadata.embeddingModel)
        if (!modelInfo?.dimensions) {
          return
        }

        const id = (
          await db
            .insert(Memory)
            .values({
              content,
              userId: ctx.userId,
              agentId: ctx.agentId,
              chatId: ctx.chatId,
            })
            .returning()
        ).at(0)?.id
        if (!id) {
          return
        }

        const embeddings = await embed([content], chat.metadata.embeddingModel)
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
            agentId: ctx.agentId,
            chatId: ctx.chatId,
          },
        })
      }
    },
  })
}

function getMemory(ctx: Context) {
  return tool({
    description:
      'Retrieve memories from the long-term memory database based on specified criteria. You can search for memories associated with the user. This tool helps you access previously stored information to maintain context and provide more relevant responses.',
    parameters: z.object({
      query: z.string().describe('the query to search for in the long-term memory database'),
    }),
    execute: async ({ query }) => {
      if ('chatId' in ctx) {
        const chat = await db.query.Chat.findFirst({
          where: eq(Chat.id, ctx.chatId),
        })
        if (!chat) {
          return []
        }
        const modelInfo = getTextEmbeddingModelInfo(chat.metadata.embeddingModel)
        if (!modelInfo?.dimensions) {
          return []
        }

        const embeddings = await embed([query], chat.metadata.embeddingModel)
        const vdb = new QdrantVector(modelInfo.dimensions)
        const memories = await vdb.searchMemoriesByEmbedding(embeddings[0]!, ctx)
        const reranker = new CohereReranker()
        const result = await reranker.rerank(
          query,
          memories.map((memory) => memory.content),
        )
        return result.documents
      }
      return []
    },
  })
}

export const memoryTools = {
  addMemory,
  getMemory,
}
