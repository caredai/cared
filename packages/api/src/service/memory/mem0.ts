import { VectorStore, MemoryGraph, Embedder, LLM, HistoryManager } from 'mem0ai/oss'
import { CaredEmbedder } from './embed'
import { createVectorStore } from './vdb'
import { CaredLLM } from './llm'
import { CaredHistoryManager } from './history'
import { env } from './env'

export interface Mem0MemoryConfig {
  languageModelId: string
  customPrompt?: string
  embeddingModelId: string
  enableGraph?: boolean
  graphLanguageModelId?: string
  graphCustomPrompt?: string
  graphThreshold?: number
}

export class Mem0Memory {
  private embedder: Embedder;
  private vectorStore: VectorStore;
  private llm: LLM;
  private db: HistoryManager;
  private graphMemory?: MemoryGraph;

  constructor(private config: Mem0MemoryConfig) {
    this.embedder = new CaredEmbedder(config.embeddingModelId)
    this.vectorStore = createVectorStore(config.embeddingModelId)
    this.llm = CaredLLM.create(config.languageModelId)
    this.db = new CaredHistoryManager()
    if (config.enableGraph&& env.NEO4J_URL && env.NEO4J_USERNAME && env.NEO4J_PASSWORD) {
      this.graphMemory = new MemoryGraph({
        embedder: {} as any,
        vectorStore: {} as any,
        llm: {} as any,
        graphStore: {
          provider: 'neo4j',
          config: {
            url: env.NEO4J_URL,
            username: env.NEO4J_USERNAME,
            password: env.NEO4J_PASSWORD,
          },
          customPrompt: config.graphCustomPrompt,
        }
      });
    }
  }
}
