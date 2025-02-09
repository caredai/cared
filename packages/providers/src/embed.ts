import { embedMany } from 'ai'

import { providers, splitModelFullId } from '.'

export async function embed(texts: string[], modelFullId: string): Promise<number[][]> {
  const { providerId, modelId } = splitModelFullId(modelFullId)
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
