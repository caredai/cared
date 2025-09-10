import type { NextRequest } from 'next/server'
import { z } from 'zod/v4'

import type { ImageGenerationDetails } from '@cared/providers'
import log from '@cared/log'
import { createCustomJsonFetch, extractImageRawResponse, splitModelFullId } from '@cared/providers'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema } from '@cared/shared'

import type { ImageModelV2CallOptions } from '@ai-sdk/provider'
import { authenticate } from '../../../auth'
import { ExpenseManager, findProvidersByModel, ProviderKeyManager } from '../../../operation'
import { handleError, makeResponseJson, requestJson } from './language'

// Schema for ImageModelV2 call options
const imageModelV2CallOptionsSchema = z.object({
  prompt: z.string(),
  n: z.number(),
  size: z.templateLiteral([z.number(), 'x', z.number()], 'Invalid size').optional(),
  aspectRatio: z.templateLiteral([z.number(), ':', z.number()], 'Invalid aspect ratio').optional(),
  seed: z.number().optional(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
  // headers: z.record(z.string(), z.string().or(z.undefined())).optional(),
})

// Request schema
const requestArgsSchema = z.object({
  modelId: z.string(),
  ...imageModelV2CallOptionsSchema.shape,

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

  const model = getModel(modelId, 'image')

  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doGenerate,
    maxImagesPerCall,
    ...modelConfig
  } = model

  return makeResponseJson({
    ...modelConfig,
    maxImagesPerCall:
      typeof maxImagesPerCall === 'function'
        ? await maxImagesPerCall({ modelId })
        : maxImagesPerCall,
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

    const { modelId, payerOrganizationId, ...imageModelV2CallOptions } = validatedArgs.data

    const auth = await authenticate()
    if (!auth.isAuthenticated()) {
      return new Response('Unauthorized', { status: 401 })
    }

    const expenseManager = ExpenseManager.from({
      auth: auth.auth!,
      payerOrganizationId,
    })

    // Allow modelId without provider prefix
    const models = await findProvidersByModel(auth.auth!, modelId, 'image')
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
            type: 'image',
            ...modelInfo,
          },
          {
            type: 'image',
            ...(imageModelV2CallOptions as ImageModelV2CallOptions),
          },
          key.byok,
        )

        const { prompt: _, ...callOptions_ } = imageModelV2CallOptions
        const details = {
          modelId,
          byok: key.byok,

          type: 'image',
          callOptions: callOptions_,
        } as ImageGenerationDetails

        const customFetch = createCustomJsonFetch({
          onSuccess: (response) => {
            details.rawResponse = extractImageRawResponse(providerId, response)
          },
          onLatency: (latency) => {
            details.latency = latency
          },
        })

        const model = getModel(modelId, 'image', key.key, customFetch)

        try {
          const startTime = performance.now()

          const result = await model.doGenerate({
            ...imageModelV2CallOptions,
            abortSignal: req.signal,
          } as any)

          details.generationTime = Math.max(
            Math.floor(performance.now() - startTime - details.latency),
            0,
          )
          details.warnings = result.warnings
          details.providerMetadata = result.providerMetadata
          const { headers: _, ...responseMetadata } = result.response
          details.responseMetadata = responseMetadata

          expenseManager.billGeneration(
            {
              type: 'image',
              ...modelInfo,
            },
            details,
          )

          keyManager.updateState(key, {
            success: true,
            latency: details.latency,
          })

          keyManager.saveState()

          return makeResponseJson(result)
        } catch (error: any) {
          lastError = error
          if (handleError(keyManager, key, error, details)) {
            // Try the next model/key if available
            continue
          } else {
            keyManager.saveState()
            throw error
          }
        }
      }

      keyManager.saveState()
    }

    if (lastError) {
      throw lastError
    }

    return new Response('Model not found', {
      status: 400,
    })
  } catch (error: any) {
    log.error('Call image model error', error)
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
