import type { NextRequest } from 'next/server'
import { z } from 'zod/v4'

import log from '@cared/log'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema } from '@cared/shared'

import { makeResponseJson, requestJson } from './language'

// Schema for EmbeddingModelV2 call options
const embeddingModelV2CallOptionsSchema = z.object({
  values: z.array(z.string()),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
  headers: z.record(z.string(), z.string().or(z.undefined())).optional(),
})

// Request schema
const requestArgsSchema = z.object({
  modelId: z.string(),
  ...embeddingModelV2CallOptionsSchema.shape,
})

export async function GET(req: NextRequest): Promise<Response> {
  const searchParams = req.nextUrl.searchParams
  const modelId = searchParams.get('modelId')
  if (!modelId) {
    return new Response('`modelId` is required', {
      status: 400,
    })
  }

  const model = getModel(modelId, 'textEmbedding')
  if (!model) {
    return new Response('Model not found', {
      status: 404,
    })
  }

  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doEmbed,
    maxEmbeddingsPerCall,
    supportsParallelCalls,
    ...modelConfig
  } = model

  return makeResponseJson({
    ...modelConfig,
    maxEmbeddingsPerCall: await maxEmbeddingsPerCall,
    supportsParallelCalls: await supportsParallelCalls,
  })
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const validatedArgs = requestArgsSchema.safeParse(await requestJson(req))
    if (!validatedArgs.success) {
      return makeResponseJson(
        {
          errors: validatedArgs.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      )
    }

    const { modelId, ...embeddingModelV2CallOptions } = validatedArgs.data

    const model = getModel(modelId, 'textEmbedding')
    if (!model) {
      return new Response('Model not found', {
        status: 404,
      })
    }

    try {
      const result = await model.doEmbed({
        ...embeddingModelV2CallOptions,
        abortSignal: req.signal,
      })
      return makeResponseJson(result)
    } catch (error: any) {
      if (error instanceof Error) {
        return makeResponseJson(
          {
            // Serialize error to ensure it can be properly transferred across the network
            error: serializeError(error),
            errorSerialized: true,
          },
          { status: 500 },
        )
      } else {
        throw error
      }
    }
  } catch (error: any) {
    log.error('Call embedding model error', error)
    return makeResponseJson(
      {
        error: error.message || 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}
