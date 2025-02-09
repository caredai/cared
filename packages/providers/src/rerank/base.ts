export interface RerankResult {
  documents: {
    content: string
    score: number
  }[]
  units: number
}

export abstract class BaseReranker {
  abstract rerank(query: string, documents: string[]): Promise<RerankResult>
}
