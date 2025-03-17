import { embedMany } from 'ai'

import { getModel } from './providers'

export async function embed(texts: string[], modelFullId: string): Promise<number[][]> {
  const embeddingModel = getModel(modelFullId, 'text-embedding')
  if (!embeddingModel) {
    throw new Error(`Embedding model ${modelFullId} not found`)
  }
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  })
  return embeddings
}
