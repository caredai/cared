import type { Schemas } from '@qdrant/js-client-rest';
import { QdrantClient } from '@qdrant/js-client-rest'
import { Mutex } from 'async-mutex'

import type { Document, SearchOptions } from './base'
import { BaseVector } from './base'
import { env } from './env'

export class QdrantVector extends BaseVector {
  private static singleton?: QdrantClient

  private client: QdrantClient
  private initialized = false
  private mutex = new Mutex()

  constructor(
    collection: string,
    private vectorSize: number,
  ) {
    super(collection)

    if (!QdrantVector.singleton) {
      QdrantVector.singleton = new QdrantClient({
        url: env.QDRANT_ENDPOINT,
        apiKey: env.QDRANT_API_KEY,
      })
    }
    this.client = QdrantVector.singleton
  }

  async insert(documents: Document | Document[]) {
    await this.init()

    documents = Array.isArray(documents) ? documents : [documents]
    await this.client.upsert(this.collection, {
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

  async get(id: string) {
    const response = (
      await this.client.retrieve(this.collection, {
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

  async exists(id: string) {
    const response = await this.client.retrieve(this.collection, {
      ids: [id],
    })
    return response.length > 0
  }

  async searchByEmbedding(
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

    const response = await this.client.search(this.collection, {
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
          ...(item.payload.metadata as Record<string, unknown>),
          score: item.score,
        } as any,
      })
    }
    return results
  }

  async searchByFulltext(
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

    const response = await this.client.scroll(this.collection, {
      with_payload: true,
      with_vector: true,
      filter: {
        must,
      },
      limit: opts?.topK ?? 2,
    })

    const results: (Omit<Document, 'embedding'> & Partial<Pick<Document, 'embedding'>>)[] = []
    for (const item of response.points) {
      if (!item.payload) {
        continue
      }
      results.push({
        id: item.id as string,
        content: item.payload.content as string,
        embedding: (item.vector ?? undefined) as number[] | undefined,
        metadata: item.payload.metadata as any,
      })
    }
    return results
  }

  async delete(ids: string[]) {
    await this.client.delete(this.collection, {
      wait: true,
      points: ids,
    })
  }

  async deleteByFilter(filter: { workspaceId?: string; datasetId?: string; documentId?: string }) {
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
    await this.client.delete(this.collection, {
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
      if (collections.collections.map((c) => c.name).includes(this.collection)) {
        return
      }

      await this.client.recreateCollection(this.collection, {
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

      await this.client.createPayloadIndex(this.collection, {
        field_name: 'metadata.workspaceId',
        field_schema: {
          type: 'uuid',
          is_tenant: true,
        },
        wait: true,
      })

      await this.client.createPayloadIndex(this.collection, {
        field_name: 'metadata.datasetId',
        field_schema: 'uuid',
        wait: true,
      })

      await this.client.createPayloadIndex(this.collection, {
        field_name: 'metadata.documentId',
        field_schema: 'uuid',
        wait: true,
      })

      await this.client.createPayloadIndex(this.collection, {
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
    })

    this.initialized = true
  }
}
