export interface RerankResult {
  documents: {
    index: number
    content: string
    relevanceScore: number
  }[]
  units: number
}

export abstract class BaseReranker {
  abstract rerank(query: string, documents: string[], model?: string): Promise<RerankResult>
}
