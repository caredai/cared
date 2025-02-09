import { CohereClient } from 'cohere-ai'

import type { RerankResult } from './base'
import { env } from '../env'
import { BaseReranker } from './base'

export class CohereReranker extends BaseReranker {
  private static singleton?: CohereClient

  private client: CohereClient

  constructor() {
    super()
    if (!CohereReranker.singleton) {
      CohereReranker.singleton = new CohereClient({
        token: env.COHERE_API_KEY,
      })
    }
    this.client = CohereReranker.singleton
  }

  async rerank(query: string, documents: string[]): Promise<RerankResult> {
    const response = await this.client.rerank({
      model: 'rerank-v3.5',
      query,
      documents,
    })
    return {
      documents: response.results
        .map((item) => ({
          content: documents[item.index] ?? '',
          relevanceScore: item.relevanceScore,
        }))
        .filter((item) => item.content),
      units: response.meta?.billedUnits?.searchUnits ?? 0,
    }
  }
}
