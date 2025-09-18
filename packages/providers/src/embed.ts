import { embed as _embed, embedMany as _embedMany } from 'ai'

import { getModel } from './providers'

export async function embed(text: string, modelFullId: string): Promise<number[]> {
  const embeddingModel = getModel(modelFullId, 'textEmbedding')
  const { embedding } = await _embed({
    model: embeddingModel,
    value: text,
  })
  return embedding
}

export async function embedMany(texts: string[], modelFullId: string): Promise<number[][]> {
  const embeddingModel = getModel(modelFullId, 'textEmbedding')
  const { embeddings } = await _embedMany({
    model: embeddingModel,
    values: texts,
  })
  return embeddings
}
