import type { Schemas } from '@qdrant/js-client-rest'
import { QdrantClient } from '@qdrant/js-client-rest'
import { Mutex } from 'async-mutex'

import type { Document, Memory, SearchOptions } from './base'
import { BaseVector } from './base'
import { env } from './env'

export class QdrantVector extends BaseVector {
  private static singleton?: QdrantClient

  private client: QdrantClient
  private initialized = false
  private mutex = new Mutex()

  private knowledgeCollection = 'knowledge'
  private memoryCollection = 'memory'

  constructor(private vectorSize: number) {
    super()

    if (!QdrantVector.singleton) {
      QdrantVector.singleton = new QdrantClient({
        url: env.QDRANT_ENDPOINT,
        apiKey: env.QDRANT_API_KEY,
      })
    }
    this.client = QdrantVector.singleton
  }

  async insertDocuments(documents: Document | Document[]) {
    await this.init()

    documents = Array.isArray(documents) ? documents : [documents]
    await this.client.upsert(this.knowledgeCollection, {
      wait: true,
      points: documents.map((doc) => ({
        id: doc.id,
        vector: doc.embedding,
        payload: {
          content: doc.content,
          metadata: doc.metadata,
        },
      })),
    })
    return documents.map((doc) => doc.id)
  }

  async getDocument(id: string) {
    const response = (
      await this.client.retrieve(this.knowledgeCollection, {
        ids: [id],
        with_payload: true,
        with_vector: true,
      })
    ).at(0)
    if (!response?.payload) {
      return
    }
    return {
      id: response.id,
      content: response.payload.content,
      embedding: response.vector,
      metadata: response.payload.metadata,
    } as Document
  }

  async hasDocument(id: string) {
    const response = await this.client.retrieve(this.knowledgeCollection, {
      ids: [id],
    })
    return response.length > 0
  }

  async searchDocumentsByEmbedding(
    embedding: number[],
    filter?: {
      workspaceId?: string
      datasetId?: string
      documentId?: string
    },
    opts?: SearchOptions,
  ) {
    const must = []
    if (filter?.workspaceId) {
      must.push({
        key: 'metadata.workspaceId',
        match: {
          value: filter.workspaceId,
        },
      })
    }
    if (filter?.datasetId) {
      must.push({
        key: 'metadata.datasetId',
        match: {
          value: filter.datasetId,
        },
      })
    }
    if (filter?.documentId) {
      must.push({
        key: 'metadata.documentId',
        match: {
          value: filter.documentId,
        },
      })
    }

    const response = await this.client.search(this.knowledgeCollection, {
      vector: embedding,
      with_payload: true,
      with_vector: true,
      filter: {
        must,
      },
      limit: opts?.topK ?? 4,
      score_threshold: opts?.scoreThreshold ?? 0,
    })

    const results: Document[] = []
    for (const item of response) {
      if (!item.payload) {
        continue
      }
      if (item.score < (opts?.scoreThreshold ?? 0)) {
        continue
      }
      results.push({
        id: item.id as string,
        content: item.payload.content as string,
        embedding: item.vector as number[],
        metadata: {
          ...(item.payload.metadata as Document['metadata']),
          score: item.score,
        },
      })
    }
    return results
  }

  async searchDocumentsByFulltext(
    query: string,
    filter?: {
      workspaceId?: string
      datasetId?: string
      documentId?: string
    },
    opts?: SearchOptions,
  ) {
    const must: Schemas['Filter']['must'] = [
      {
        key: 'content',
        match: {
          text: query,
        },
      },
    ]
    if (filter?.workspaceId) {
      must.push({
        key: 'metadata.workspaceId',
        match: {
          value: filter.workspaceId,
        },
      })
    }
    if (filter?.datasetId) {
      must.push({
        key: 'metadata.datasetId',
        match: {
          value: filter.datasetId,
        },
      })
    }
    if (filter?.documentId) {
      must.push({
        key: 'metadata.documentId',
        match: {
          value: filter.documentId,
        },
      })
    }

    const response = await this.client.scroll(this.knowledgeCollection, {
      with_payload: true,
      with_vector: true,
      filter: {
        must,
      },
      limit: opts?.topK ?? 2,
    })

    const results: (Omit<Document, 'embedding'> & { embedding?: number[] })[] = []
    for (const item of response.points) {
      if (!item.payload) {
        continue
      }
      results.push({
        id: item.id as string,
        content: item.payload.content as string,
        embedding: (item.vector ?? undefined) as number[] | undefined,
        metadata: item.payload.metadata as Document['metadata'],
      })
    }
    return results
  }

  async deleteDocuments(ids: string[]) {
    await this.client.delete(this.knowledgeCollection, {
      wait: true,
      points: ids,
    })
  }

  async deleteDocumentsByFilter(filter: { workspaceId?: string; datasetId?: string; documentId?: string }) {
    const match: Record<string, unknown> = {}
    if (filter.workspaceId) {
      match['metadata.workspaceId'] = filter.workspaceId
    }
    if (filter.datasetId) {
      match['metadata.datasetId'] = filter.datasetId
    }
    if (filter.documentId) {
      match['metadata.documentId'] = filter.documentId
    }
    await this.client.delete(this.knowledgeCollection, {
      wait: true,
      filter: {
        must: {
          match,
        },
      },
    })
  }

  async insertMemories(memories: Memory | Memory[]) {
    await this.init()

    memories = Array.isArray(memories) ? memories : [memories]
    await this.client.upsert(this.memoryCollection, {
      wait: true,
      points: memories.map((memory) => ({
        id: memory.id,
        vector: memory.embedding,
        payload: {
          content: memory.content,
          metadata: memory.metadata,
        },
      })),
    })
    return memories.map((memory) => memory.id)
  }

  async getMemory(id: string) {
    const response = (
      await this.client.retrieve(this.memoryCollection, {
        ids: [id],
        with_payload: true,
        with_vector: true,
      })
    ).at(0)
    if (!response?.payload) {
      return
    }
    return {
      id: response.id,
      content: response.payload.content,
      embedding: response.vector,
      metadata: response.payload.metadata,
    } as Memory
  }

  async hasMemory(id: string) {
    const response = await this.client.retrieve(this.memoryCollection, {
      ids: [id],
    })
    return response.length > 0
  }

  async searchMemoriesByEmbedding(
    embedding: number[],
    filter?: {
      userId?: string
      agentId?: string
      chatId?: string
      roomId?: string
    },
    opts?: SearchOptions,
  ) {
    const must = []
    if (filter?.userId) {
      must.push({
        key: 'metadata.userId',
        match: {
          value: filter.userId,
        },
      })
    }
    if (filter?.agentId) {
      must.push({
        key: 'metadata.agentId',
        match: {
          value: filter.agentId,
        },
      })
    }
    if (filter?.chatId) {
      must.push({
        key: 'metadata.chatId',
        match: {
          value: filter.chatId,
        },
      })
    }
    if (filter?.roomId) {
      must.push({
        key: 'metadata.roomId',
        match: {
          value: filter.roomId,
        },
      })
    }

    const response = await this.client.search(this.memoryCollection, {
      vector: embedding,
      with_payload: true,
      with_vector: true,
      filter: {
        must,
      },
      limit: opts?.topK ?? 4,
      score_threshold: opts?.scoreThreshold ?? 0,
    })

    const results: Memory[] = []
    for (const item of response) {
      if (!item.payload) {
        continue
      }
      if (item.score < (opts?.scoreThreshold ?? 0)) {
        continue
      }
      results.push({
        id: item.id as string,
        content: item.payload.content as string,
        embedding: item.vector as number[],
        metadata: {
          ...(item.payload.metadata as Memory['metadata']),
          score: item.score,
        },
      })
    }
    return results
  }

  async searchMemoriesByFulltext(
    query: string,
    filter?: {
      userId?: string
      agentId?: string
      chatId?: string
      roomId?: string
    },
    opts?: SearchOptions,
  ) {
    const must: Schemas['Filter']['must'] = [
      {
        key: 'content',
        match: {
          text: query,
        },
      },
    ]
    if (filter?.userId) {
      must.push({
        key: 'metadata.userId',
        match: {
          value: filter.userId,
        },
      })
    }
    if (filter?.agentId) {
      must.push({
        key: 'metadata.agentId',
        match: {
          value: filter.agentId,
        },
      })
    }
    if (filter?.chatId) {
      must.push({
        key: 'metadata.chatId',
        match: {
          value: filter.chatId,
        },
      })
    }
    if (filter?.roomId) {
      must.push({
        key: 'metadata.roomId',
        match: {
          value: filter.roomId,
        },
      })
    }

    const response = await this.client.scroll(this.memoryCollection, {
      with_payload: true,
      with_vector: true,
      filter: {
        must,
      },
      limit: opts?.topK ?? 2,
    })

    const results: (Omit<Memory, 'embedding'> & { embedding?: number[] })[] = []
    for (const item of response.points) {
      if (!item.payload) {
        continue
      }
      results.push({
        id: item.id as string,
        content: item.payload.content as string,
        embedding: (item.vector ?? undefined) as number[] | undefined,
        metadata: item.payload.metadata as Memory['metadata'],
      })
    }
    return results
  }

  async deleteMemories(ids: string[]) {
    await this.client.delete(this.memoryCollection, {
      wait: true,
      points: ids,
    })
  }

  async deleteMemoriesByFilter(filter: {
    userId?: string
    agentId?: string
    chatId?: string
    roomId?: string
  }) {
    const match: Record<string, unknown> = {}
    if (filter.userId) {
      match['metadata.userId'] = filter.userId
    }
    if (filter.agentId) {
      match['metadata.agentId'] = filter.agentId
    }
    if (filter.chatId) {
      match['metadata.chatId'] = filter.chatId
    }
    if (filter.roomId) {
      match['metadata.roomId'] = filter.roomId
    }
    await this.client.delete(this.memoryCollection, {
      wait: true,
      filter: {
        must: {
          match,
        },
      },
    })
  }

  private async init() {
    if (this.initialized) {
      return
    }

    await this.mutex.runExclusive(async () => {
      const collections = await this.client.getCollections()
      const existingCollections = collections.collections.map((c) => c.name)

      // Initialize knowledge collection if not exists
      if (!existingCollections.includes(this.knowledgeCollection)) {
        await this.initKnowledgeCollection()
      }

      // Initialize memory collection if not exists
      if (!existingCollections.includes(this.memoryCollection)) {
        await this.initMemoryCollection()
      }
    })

    this.initialized = true
  }

  private async initKnowledgeCollection() {
    await this.client.recreateCollection(this.knowledgeCollection, {
      vectors: {
        size: this.vectorSize,
        distance: 'Cosine',
      },
      hnsw_config: {
        m: 0,
        ef_construct: 100,
        full_scan_threshold: 10000,
        max_indexing_threads: 0,
        on_disk: false,
        payload_m: 16,
      },
      timeout: 20,
    })

    await this.client.createPayloadIndex(this.knowledgeCollection, {
      field_name: 'metadata.workspaceId',
      field_schema: {
        type: 'uuid',
        is_tenant: true,
      },
      wait: true,
    })

    await this.client.createPayloadIndex(this.knowledgeCollection, {
      field_name: 'metadata.datasetId',
      field_schema: 'uuid',
      wait: true,
    })

    await this.client.createPayloadIndex(this.knowledgeCollection, {
      field_name: 'metadata.documentId',
      field_schema: 'uuid',
      wait: true,
    })

    await this.client.createPayloadIndex(this.knowledgeCollection, {
      field_name: 'content',
      field_schema: {
        type: 'text',
        tokenizer: 'multilingual',
        min_token_len: 2,
        max_token_len: 20,
        lowercase: true,
      },
      wait: true,
    })
  }

  private async initMemoryCollection() {
    await this.client.recreateCollection(this.memoryCollection, {
      vectors: {
        size: this.vectorSize,
        distance: 'Cosine',
      },
      hnsw_config: {
        m: 0,
        ef_construct: 100,
        full_scan_threshold: 10000,
        max_indexing_threads: 0,
        on_disk: false,
        payload_m: 16,
      },
      timeout: 20,
    })

    await this.client.createPayloadIndex(this.memoryCollection, {
      field_name: 'metadata.userId',
      field_schema: {
        type: 'uuid',
        is_tenant: true,
      },
      wait: true,
    })

    await this.client.createPayloadIndex(this.memoryCollection, {
      field_name: 'metadata.agentId',
      field_schema: 'uuid',
      wait: true,
    })

    await this.client.createPayloadIndex(this.memoryCollection, {
      field_name: 'metadata.chatId',
      field_schema: 'uuid',
      wait: true,
    })

    await this.client.createPayloadIndex(this.memoryCollection, {
      field_name: 'metadata.roomId',
      field_schema: 'uuid',
      wait: true,
    })

    await this.client.createPayloadIndex(this.memoryCollection, {
      field_name: 'content',
      field_schema: {
        type: 'text',
        tokenizer: 'multilingual',
        min_token_len: 2,
        max_token_len: 20,
        lowercase: true,
      },
      wait: true,
    })
  }
}
