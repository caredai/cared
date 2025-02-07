import { QdrantClient } from '@qdrant/js-client-rest'
import { Mutex } from 'async-mutex'

import type { Document } from './base'
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
    documents = Array.isArray(documents) ? documents : [documents]
    await this.client.upsert(this.collection, {
      wait: true,
      points: documents.map((doc) => ({
        id: doc.metadata.documentId,
        vector: doc.embedding,
        payload: {
          content: doc.content,
          metadata: doc.metadata,
        },
      })),
    })
    return documents.map((doc) => doc.metadata.documentId)
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
