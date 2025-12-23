import type { Embedder as _Embedder } from 'mem0ai/oss'

import { modelFullId } from '@cared/providers'
import { embed, embedMany } from '@cared/providers/embed'

export class Embedder implements _Embedder {
  constructor(private fullModelId: string = modelFullId('openai', 'text-embedding-3-small')) {}

  embed(text: string): Promise<number[]> {
    return embed(text, this.fullModelId)
  }

  embedBatch(texts: string[]): Promise<number[][]> {
    return embedMany(texts, this.fullModelId)
  }
}
