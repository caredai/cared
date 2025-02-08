export interface Document {
  id: string // segmentId or chunkId
  content: string
  embedding: number[]
  metadata: {
    workspaceId: string
    datasetId: string
    documentId: string
    [key: string]: unknown
  }
}

export interface Memory {
  id: string
  content: string
  embedding: number[]
  metadata: {
    userId: string
    [key: string]: unknown
  } & ({ agentId: string; chatId: string } | { roomId: string })
}

export interface SearchOptions {
  topK?: number
  scoreThreshold?: number
}

export abstract class BaseVector {
  abstract insertDocuments(documents: Document | Document[]): Promise<string[]>

  abstract getDocument(id: string): Promise<Document | undefined>

  abstract hasDocument(id: string): Promise<boolean>

  abstract searchDocumentsByEmbedding(
    embedding: number[],
    filter?: {
      workspaceId?: string
      datasetId?: string
      documentId?: string
    },
    opts?: SearchOptions,
  ): Promise<Document[]>

  abstract searchDocumentsByFulltext(
    query: string,
    filter?: {
      workspaceId?: string
      datasetId?: string
      documentId?: string
    },
    opts?: SearchOptions,
  ): Promise<(Omit<Document, 'embedding'> & { embedding?: number[] })[]>

  abstract deleteDocuments(ids: string[]): Promise<void>

  abstract deleteDocumentsByFilter(filter: {
    workspaceId?: string
    datasetId?: string
    documentId?: string
  }): Promise<void>

  abstract insertMemories(memories: Memory | Memory[]): Promise<string[]>

  abstract getMemory(id: string): Promise<Memory | undefined>

  abstract hasMemory(id: string): Promise<boolean>

  abstract searchMemoriesByEmbedding(
    embedding: number[],
    filter?: {
      userId?: string
      agentId?: string
      chatId?: string
      roomId?: string
    },
    opts?: SearchOptions,
  ): Promise<Memory[]>

  abstract searchMemoriesByFulltext(
    query: string,
    filter?: {
      userId?: string
      agentId?: string
      chatId?: string
      roomId?: string
    },
    opts?: SearchOptions,
  ): Promise<(Omit<Memory, 'embedding'> & { embedding?: number[] })[]>

  abstract deleteMemories(ids: string[]): Promise<void>

  abstract deleteMemoriesByFilter(filter: {
    userId?: string
    agentId?: string
    chatId?: string
    roomId?: string
  }): Promise<void>
}
