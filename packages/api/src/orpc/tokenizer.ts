import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod/v4'

import { tokenizerCount, tokenizerDecode, tokenizerEncode } from '@cared/tokenizer'

import { publicProcedure } from '../orpc'

export const tokenizerRouter = {
  encode: publicProcedure
    .route({
      method: 'POST',
      path: '/v1/tokenizer/encode',
      tags: ['tokenizer'],
      summary: 'Encode text to tokens using specified model',
    })
    .input(
      z.object({
        text: z.string().min(1),
        modelId: z.string().min(1),
      }),
    )
    .handler(async ({ input: { text, modelId } }) => {
      return await tokenizerEncode(text, modelId, fetchModel)
    }),

  decode: publicProcedure
    .route({
      method: 'POST',
      path: '/v1/tokenizer/decode',
      tags: ['tokenizer'],
      summary: 'Decode tokens to text using specified model',
    })
    .input(
      z.object({
        tokens: z.array(z.number()).min(1),
        modelId: z.string().min(1),
      }),
    )
    .handler(async ({ input: { tokens, modelId } }) => {
      return await tokenizerDecode(tokens, modelId, fetchModel)
    }),

  count: publicProcedure
    .route({
      method: 'POST',
      path: '/v1/tokenizer/count',
      tags: ['tokenizer'],
      summary: 'Count tokens in messages using specified model',
    })
    .input(
      z.object({
        messages: z.array(z.record(z.string(), z.string())).min(1),
        modelId: z.string().min(1),
      }),
    )
    .handler(async ({ input: { messages, modelId } }) => {
      return await tokenizerCount(messages, modelId, fetchModel)
    }),
}

/**
 * Fetch tokenizer model file from assets directory
 * @param modelFilename - The filename of the tokenizer model
 * @returns Promise<Buffer> - The model file content
 */
async function fetchModel(modelFilename: string) {
  return (await fs.readFile(
    path.join(process.cwd(), `../../packages/tokenizer/assets/tokenizers/${modelFilename}`),
  )) as unknown as ArrayBuffer
}
