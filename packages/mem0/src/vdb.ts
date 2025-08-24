import { Qdrant } from 'mem0ai/oss'

import { getTextEmbeddingDimensions } from '@cared/providers'
import { QdrantVector } from '@cared/vdb'

export async function createVectorStore(fullModelId: string) {
  const dimensions = await getTextEmbeddingDimensions(fullModelId)
  if (dimensions) {
    return
  }
  return new Qdrant({
    client: new QdrantVector(dimensions).client,
    collectionName: `mem0-${dimensions}`,
    dimensions: dimensions,
    embeddingModelDims: 0, // unused
  })
}
