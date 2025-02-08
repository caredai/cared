import { embedMany } from 'ai'

import type { ProviderId } from '.'
import { providers } from '.'

export async function embed(
  texts: string[],
  providerId: ProviderId,
  modelId: string,
): Promise<number[][]> {
  const provider = providers[providerId]
  if (!provider.textEmbeddingModel) {
    throw new Error(`Provider ${providerId} does not support text embedding`)
  }
  const { embeddings } = await embedMany({
    model: provider.textEmbeddingModel(modelId),
    values: texts,
  })
  return embeddings
}
