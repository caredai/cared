import { Qdrant } from 'mem0ai/oss'

import { getTextEmbeddingModelInfo } from '@ownxai/providers'
import { QdrantVector } from '@ownxai/vdb'

export async function createVectorStore(fullModelId: string) {
  const modelInfo = await getTextEmbeddingModelInfo(fullModelId)
  if (!modelInfo?.dimensions) {
    return
  }
  return new Qdrant({
    client: new QdrantVector(modelInfo.dimensions).client,
    collectionName: `mem0-${modelInfo.dimensions}`,
    dimensions: modelInfo.dimensions,
    embeddingModelDims: 0, // unused
  })
}
