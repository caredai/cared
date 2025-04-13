import type { Embedder } from 'mem0ai/oss'

import { embed, embedMany } from '@ownxai/providers/embed'

export class OwnxEmbedder implements Embedder {
  constructor(private fullModelId: string) {}

  embed(text: string): Promise<number[]> {
    return embed(text, this.fullModelId)
  }

  embedBatch(texts: string[]): Promise<number[][]> {
    return embedMany(texts, this.fullModelId)
  }
}
