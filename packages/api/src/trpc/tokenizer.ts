import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod/v4'

import { tokenizerCount, tokenizerDecode, tokenizerEncode } from '@cared/tokenizer'

import { publicProcedure } from '../trpc'

export const tokenizerRouter = {
  encode: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        modelId: z.string().min(1),
      }),
    )
    .query(async ({ input: { text, modelId } }) => {
      return await tokenizerEncode(text, modelId, fetchModel)
    }),

  decode: publicProcedure
    .input(
      z.object({
        tokens: z.array(z.number()).min(1),
        modelId: z.string().min(1),
      }),
    )
    .query(async ({ input: { tokens, modelId } }) => {
      return await tokenizerDecode(tokens, modelId, fetchModel)
    }),

  count: publicProcedure
    .input(
      z.object({
        messages: z.array(z.record(z.string(), z.string())).min(1),
        modelId: z.string().min(1),
      }),
    )
    .query(async ({ input: { messages, modelId } }) => {
      return await tokenizerCount(messages, modelId, fetchModel)
    }),
}

async function fetchModel(modelFilename: string) {
  return fs.readFile(
    path.join(process.cwd(), `../../packages/tokenizer/assets/tokenizers/${modelFilename}`),
  )
}
