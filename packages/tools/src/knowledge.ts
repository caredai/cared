import { tool } from 'ai'
import { z } from 'zod'

import type { Document } from '@mindworld/vdb'
import { and, eq, inArray } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import {
  AgentVersionToDataset,
  AppVersionToDataset,
  Dataset,
  DocumentChunk,
  DocumentSegment,
} from '@mindworld/db/schema'
import { getTextEmbeddingModelInfo } from '@mindworld/providers'
import { embed } from '@mindworld/providers/embed'
import { CohereReranker } from '@mindworld/providers/rerank'
import { QdrantVector } from '@mindworld/vdb'

import type { Context } from './context'

function listKnowledgeBases(ctx: Context) {
  return tool({
    description:
      'Lists available knowledge bases with their IDs, names and descriptions. Each knowledge base contains specific domain knowledge. Use this tool to discover which knowledge base is most relevant for your current information need, then use the searchKnowledge tool with the appropriate knowledge base ID to retrieve information.',
    parameters: z.object({
      scope: z
        .enum(['app', 'agent'])
        .describe(
          'The scope of knowledge bases to list. Use "app" to list knowledge bases bound to the current app (for general app-wide knowledge), "agent" to list knowledge bases bound to the current agent (for agent-specific knowledge and capabilities).',
        ),
    }),
    execute: async ({ scope }) => {
      // Get datasets based on scope
      const datasets = []

      if (scope === 'app') {
        // Query app-scoped datasets
        const bindings = await db
          .select({
            dataset: Dataset,
          })
          .from(AppVersionToDataset)
          .where(
            and(
              eq(AppVersionToDataset.appId, ctx.appId),
              eq(AppVersionToDataset.version, ctx.version),
            ),
          )
          .innerJoin(Dataset, eq(Dataset.id, AppVersionToDataset.datasetId))

        datasets.push(...bindings.map((b) => b.dataset))
      } else {
        // Query agent-scoped datasets
        const bindings = await db
          .select({
            dataset: Dataset,
          })
          .from(AgentVersionToDataset)
          .where(
            and(
              eq(AgentVersionToDataset.agentId, ctx.agentId),
              eq(AgentVersionToDataset.version, ctx.version),
            ),
          )
          .innerJoin(Dataset, eq(Dataset.id, AgentVersionToDataset.datasetId))

        datasets.push(...bindings.map((b) => b.dataset))
      }

      return datasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
        description: dataset.metadata.description,
      }))
    },
  })
}

function searchKnowledge(_ctx: Context) {
  return tool({
    description:
      'Search within a specific knowledge base using natural language queries or keywords. This tool allows you to retrieve relevant information from the selected knowledge base to help answer questions and provide accurate responses.',
    parameters: z.object({
      query: z
        .string()
        .describe(
          'Natural language query or space-separated keywords to search for information. Be specific and concise to get the most relevant results',
        ),
      knowledgeBaseId: z
        .string()
        .describe(
          'ID of the knowledge base to search in. Use the listKnowledgeBases tool first to find the appropriate knowledge base ID',
        ),
    }),
    execute: async ({ query, knowledgeBaseId }) => {
      const dataset = await db.query.Dataset.findFirst({
        where: eq(Dataset.id, knowledgeBaseId),
      })
      if (!dataset) {
        return []
      }

      // Get embeddings for the query
      const embeddings = await embed([query], dataset.metadata.embeddingModel)
      const embedding = embeddings.at(0)
      if (!embedding) {
        return []
      }

      // Initialize vector database with correct dimensions
      const modelInfo = getTextEmbeddingModelInfo(dataset.metadata.embeddingModel)
      if (!modelInfo?.dimensions) {
        return []
      }
      const vdb = new QdrantVector(modelInfo.dimensions)

      // Search for relevant documents
      const filter = {
        workspaceId: dataset.workspaceId,
        datasetId: dataset.id,
      }

      const retrievalMode = dataset.metadata.retrievalMode
      const topK = dataset.metadata.topK
      const scoreThreshold = dataset.metadata.scoreThreshold

      const results: Document[] = []

      if (retrievalMode === 'vector-search' || retrievalMode === 'hybrid-search') {
        const vectorResults = await vdb.searchDocumentsByEmbedding(embedding, filter, {
          topK,
          scoreThreshold,
        })
        results.push(...vectorResults)
      }

      if (retrievalMode === 'full-text-search' || retrievalMode === 'hybrid-search') {
        const textResults = await vdb.searchDocumentsByFulltext(query, filter, {
          topK,
          scoreThreshold,
        })
        results.push(...textResults)
      }

      if (results.length <= 0) {
        return []
      }

      // Rerank results
      const reranker = new CohereReranker()
      const rerankedResults = await reranker.rerank(
        query,
        results.map((r) => r.content),
        dataset.metadata.rerankModel,
      )

      // Get original documents based on reranked indices
      const rerankedDocuments = rerankedResults.documents.map(({ index }) => results[index]!)

      // Get DocumentSegments for the chunks
      const documentSegments = await db
        .select({
          content: DocumentSegment.content,
        })
        .from(DocumentChunk)
        .innerJoin(DocumentSegment, eq(DocumentSegment.id, DocumentChunk.segmentId))
        .where(
          inArray(
            DocumentChunk.id,
            rerankedDocuments.map((doc) => doc.id),
          ),
        )

      return documentSegments.map((segment) => segment.content)
    },
  })
}

export const knowledgeTools = {
  listKnowledgeBases,
  searchKnowledge,
}
