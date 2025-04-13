import { Memory } from 'mem0ai/oss'

import { OwnxEmbedder } from './embed'
import { env } from './env'
import { OwnxHistoryManager } from './history'
import { OwnxLLM } from './llm'
import { createVectorStore } from './vdb'

export interface Mem0MemoryConfig {
  languageModelId: string
  embeddingModelId: string
  disableHistory?: boolean
  enableGraph?: boolean
  graphLanguageModelId?: string
  customPrompt?: string
  graphCustomPrompt?: string
}

export class Mem0Memory extends Memory {
  constructor(config: Mem0MemoryConfig) {
    super({
      vectorStore: {
        config: {
          dbPath: '/tmp/vector_store.db',
        } as any,
      } as any,
      disableHistory: true,
      enableGraph: config.enableGraph,
      ...(config.enableGraph && env.NEO4J_URL && env.NEO4J_USERNAME && env.NEO4J_PASSWORD
        ? {
            graphStore: {
              provider: 'neo4j',
              config: {
                url: env.NEO4J_URL,
                username: env.NEO4J_USERNAME,
                password: env.NEO4J_PASSWORD,
              },
              customPrompt: config.graphCustomPrompt,
            },
          }
        : {}),
      customPrompt: config.customPrompt,
    })

    const thisAsAny = this as any
    thisAsAny.embedder = new OwnxEmbedder(config.embeddingModelId)
    thisAsAny.vectorStore = createVectorStore(config.embeddingModelId)
    if (!thisAsAny.vectorStore) {
      throw new Error('invalid embedding model')
    }
    thisAsAny.llm = OwnxLLM.create(config.languageModelId)
    if (!thisAsAny.llm) {
      throw new Error('invalid language model')
    }
    if (!config.disableHistory) {
      thisAsAny.db = new OwnxHistoryManager()
    }
    thisAsAny.collectionName = thisAsAny.vectorStore.collectionName
    if (config.enableGraph) {
      const graph = thisAsAny.graphMemory
      graph.embeddingModel = thisAsAny.embedder
      if (config.graphLanguageModelId) {
        graph.llm = OwnxLLM.create(config.graphLanguageModelId)
      } else {
        graph.llm = thisAsAny.llm
      }
      graph.structuredLlm = graph.llm
    }
  }
}
