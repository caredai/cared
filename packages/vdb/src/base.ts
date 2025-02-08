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

export interface SearchOptions {
  topK?: number
  scoreThreshold?: number
}

export abstract class BaseVector {
  protected constructor(protected collection: string) {}

  abstract insert(documents: Document | Document[]): Promise<string[]>
}
