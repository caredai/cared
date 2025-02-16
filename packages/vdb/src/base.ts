export interface Document {
  id: string // segmentId or chunkId
  content: string
  metadata: {
    workspaceId: string
    datasetId: string
    documentId: string
    [key: string]: unknown
  }
}

export interface DocumentWithEmbedding extends Document {
  embedding: number[]
}

export interface Memory {
  id: string
  content: string
  metadata: {
    userId: string
    appId: string
    chatId?: string
    [key: string]: unknown
  }
}

export interface MemoryWithEmbedding extends Memory {
  embedding: number[]
}

export interface SearchOptions {
  topK?: number
  scoreThreshold?: number
}

export abstract class BaseVector {
  abstract insertDocuments(
    documents: DocumentWithEmbedding | DocumentWithEmbedding[],
  ): Promise<string[]>

  abstract getDocument(id: string): Promise<DocumentWithEmbedding | undefined>

  abstract hasDocument(id: string): Promise<boolean>

  abstract searchDocumentsByEmbedding(
    embedding: number[],
    filter?: {
      workspaceId?: string
      datasetId?: string
      documentId?: string
    },
    opts?: SearchOptions,
  ): Promise<DocumentWithEmbedding[]>

  abstract searchDocumentsByFulltext(
    query: string,
    filter?: {
      workspaceId?: string
      datasetId?: string
      documentId?: string
    },
    opts?: SearchOptions,
  ): Promise<Document[]>

  abstract deleteDocuments(ids: string[]): Promise<void>

  abstract deleteDocumentsByFilter(filter: {
    workspaceId?: string
    datasetId?: string
    documentId?: string
  }): Promise<void>

  abstract insertMemories(memories: MemoryWithEmbedding | MemoryWithEmbedding[]): Promise<string[]>

  abstract getMemory(id: string): Promise<MemoryWithEmbedding | undefined>

  abstract hasMemory(id: string): Promise<boolean>

  abstract searchMemoriesByEmbedding(
    embedding: number[],
    filter?: {
      userId?: string
      appId?: string
      chatId?: string
    },
    opts?: SearchOptions,
  ): Promise<MemoryWithEmbedding[]>

  abstract searchMemoriesByFulltext(
    query: string,
    filter?: {
      userId?: string
      appId?: string
      chatId?: string
    },
    opts?: SearchOptions,
  ): Promise<Memory[]>

  abstract deleteMemories(ids: string[]): Promise<void>

  abstract deleteMemoriesByFilter(filter: {
    userId?: string
    appId?: string
    chatId?: string
  }): Promise<void>
}
