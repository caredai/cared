import { UnstructuredClient } from 'unstructured-client'
import { ChunkingStrategy, Strategy } from 'unstructured-client/sdk/models/shared'

import { env } from './env'

export class UnstructuredEtl {
  private static singleton?: UnstructuredClient

  private client: UnstructuredClient

  constructor() {
    if (!UnstructuredEtl.singleton) {
      UnstructuredEtl.singleton = new UnstructuredClient({
        serverURL: env.UNSTRUCTURED_API_URL,
        security: {
          apiKeyAuth: env.UNSTRUCTURED_API_KEY,
        },
        retryConfig: {
          strategy: 'backoff',
          retryConnectionErrors: true,
          backoff: {
            initialInterval: 500,
            maxInterval: 60000,
            exponent: 1.5,
            maxElapsedTime: 900000, // 15 minutes
          },
        },
      })
    }
    this.client = UnstructuredEtl.singleton
  }

  async extract(data: Uint8Array, filename: string): Promise<string[]> {
    const response = await this.client.general.partition({
      partitionParameters: {
        files: {
          content: data,
          fileName: filename,
        },
        chunkingStrategy: ChunkingStrategy.ByTitle,
        combineUnderNChars: 2000,
        maxCharacters: 2000,
        strategy: Strategy.Auto,
        splitPdfPage: true,
        splitPdfAllowFailed: true,
        splitPdfConcurrencyLevel: 15,
      },
    })
    if (response.statusCode === 200) {
      // https://docs.unstructured.io/api-reference/how-to/transform-schemas
      return response.elements?.map((e) => e.text as string) ?? []
    }
    return []
  }
}
