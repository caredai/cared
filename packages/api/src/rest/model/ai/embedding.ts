import type { NextRequest } from 'next/server'
import { z } from 'zod/v4'

import type { EmbeddingModelV2CallOptions, TextEmbeddingGenerationDetails } from '@cared/providers'
import log from '@cared/log'
import {
  createCustomJsonFetch,
  extractEmbeddingRawResponse,
  splitModelFullId,
} from '@cared/providers'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema } from '@cared/shared'

import { authenticate } from '../../../auth'
import { ExpenseManager, findProvidersByModel, ProviderKeyManager } from '../../../operation'
import { handleError, makeResponseJson, requestJson } from './language'

// Schema for EmbeddingModelV2 call options
const embeddingModelV2CallOptionsSchema = z.object({
  values: z.array(z.string()),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
  // headers: z.record(z.string(), z.string().or(z.undefined())).optional(),
})

// Request schema
const requestArgsSchema = z.object({
  modelId: z.string(),
  ...embeddingModelV2CallOptionsSchema.shape,

  payerOrganizationId: z.string().optional(),
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
          error: z.prettifyError(validatedArgs.error),
        },
        {
          status: 400,
        },
      )
    }

    const { modelId, payerOrganizationId, ...embeddingModelV2CallOptions } = validatedArgs.data

    const auth = await authenticate()
    if (!auth.isAuthenticated()) {
      return new Response('Unauthorized', { status: 401 })
    }

    const expenseManager = ExpenseManager.from({
      auth: auth.auth!,
      payerOrganizationId,
    })

    // Allow modelId without provider prefix
    const models = await findProvidersByModel(auth.auth!, modelId, 'textEmbedding')
    log.info(
      `Input model id: ${modelId}, resolved model ids: ${models.map((m) => m.id).join(', ')}`,
    )

    let lastError: Error | undefined

    for (const modelInfo of models) {
      const modelId = modelInfo.id
      const providerId = splitModelFullId(modelId).providerId

      const keyManager = await ProviderKeyManager.from({
        auth: auth.auth!,
        modelId,
        onlyByok: !modelInfo.chargeable,
      })

      const keys = keyManager.selectKeys()

      for (const key of keys) {
        log.info(`Using provider key ${key.id} for model ${modelId}`)

        await expenseManager.canAfford(
          {
            type: 'textEmbedding',
            ...modelInfo,
          },
          {
            type: 'textEmbedding',
            ...(embeddingModelV2CallOptions as EmbeddingModelV2CallOptions),
          },
          key.byok,
        )

        const details = {
          modelId,
          byok: key.byok,

          type: 'textEmbedding',
          callOptions: embeddingModelV2CallOptions,
        } as TextEmbeddingGenerationDetails

        const customFetch = createCustomJsonFetch({
          onResponse: (response) => {
            details.rawResponse = extractEmbeddingRawResponse(providerId, response)
          },
          onLatency: (latency) => {
            details.latency = latency
          },
        })

        const model = getModel(modelId, 'textEmbedding', key.key, customFetch)

        try {
          const result = await model.doEmbed({
            ...embeddingModelV2CallOptions,
            abortSignal: req.signal,
          })

          details.warnings = result.warnings
          details.providerMetadata = result.providerMetadata
          details.responseMetadata = result.response

          await expenseManager.billGeneration(
            {
              type: 'textEmbedding',
              ...modelInfo,
            },
            details,
          )

          keyManager.updateState(key, {
            success: true,
            latency: details.latency,
          })

          await keyManager.saveState() // TODO: waitUntil

          return makeResponseJson(result)
        } catch (error: any) {
          lastError = error
          if (handleError(keyManager, key, error, details)) {
            // Try the next model/key if available
            continue
          } else {
            await keyManager.saveState() // TODO: waitUntil
            throw error
          }
        }
      }

      await keyManager.saveState() // TODO: waitUntil
    }

    if (lastError) {
      throw lastError
    }

    return new Response('Model not found', {
      status: 400,
    })
  } catch (error: any) {
    log.error('Call embedding model error', error)
    return makeResponseJson(
      {
        error:
          error instanceof Error
            ? // Serialize error to ensure it can be properly transferred across the network
              serializeError(error)
            : error.message || 'An unknown error occurred',
        errorSerialized: error instanceof Error,
      },
      { status: 500 },
    )
  }
}
