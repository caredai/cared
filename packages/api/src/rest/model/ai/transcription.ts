import type { NextRequest } from 'next/server'
import { z } from 'zod/v4'

import type { TranscriptionGenerationDetails } from '@cared/providers'
import log from '@cared/log'
import { createCustomJsonFetch } from '@cared/providers'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema } from '@cared/shared'

import type { TranscriptionModelV2CallOptions } from '@ai-sdk/provider'
import { authenticate } from '../../../auth'
import { ExpenseManager, findProvidersByModel, ProviderKeyManager } from '../../../operation'
import { handleError, makeResponseJson, requestJson } from './language'

// Schema for TranscriptionModelV2 call options
const transcriptionModelV2CallOptionsSchema = z.object({
  audio: z.union([
    z.instanceof(Uint8Array),
    z.string(), // base64 encoded audio
  ]),
  mediaType: z.string(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
  // headers: z.record(z.string(), z.string().or(z.undefined())).optional(),
})

// Request schema
const requestArgsSchema = z.object({
  modelId: z.string(),
  ...transcriptionModelV2CallOptionsSchema.shape,

  payerOrganizationId: z.string().optional(),
})

export function GET(req: NextRequest): Response {
  const searchParams = req.nextUrl.searchParams
  const modelId = searchParams.get('modelId')
  if (!modelId) {
    return new Response('`modelId` is required', {
      status: 400,
    })
  }

  const model = getModel(modelId, 'transcription')

  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doGenerate,
    ...modelConfig
  } = model

  return makeResponseJson(modelConfig)
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

    const { modelId, payerOrganizationId, ...transcriptionModelV2CallOptions } = validatedArgs.data

    const auth = await authenticate()
    if (!auth.isAuthenticated()) {
      return new Response('Unauthorized', { status: 401 })
    }

    const expenseManager = ExpenseManager.from({
      auth: auth.auth!,
      payerOrganizationId,
    })

    // Allow modelId without provider prefix
    const models = await findProvidersByModel(auth.auth!, modelId, 'transcription')
    log.info(
      `Input model id: ${modelId}, resolved model ids: ${models.map((m) => m.id).join(', ')}`,
    )

    let lastError: Error | undefined

    for (const modelInfo of models) {
      const modelId = modelInfo.id

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
            type: 'transcription',
            ...modelInfo,
          },
          {
            type: 'transcription',
            ...(transcriptionModelV2CallOptions as TranscriptionModelV2CallOptions),
          },
          key.byok,
        )

        const { audio: _, ...callOptions_ } = transcriptionModelV2CallOptions
        const details = {
          modelId,
          byok: key.byok,

          type: 'transcription',
          callOptions: callOptions_,
        } as TranscriptionGenerationDetails

        const customFetch = createCustomJsonFetch({
          onLatency: (latency) => {
            details.latency = latency
          },
        })

        const model = getModel(modelId, 'transcription', key.key, customFetch)

        try {
          const startTime = performance.now()

          const result = await model.doGenerate({
            ...transcriptionModelV2CallOptions,
            abortSignal: req.signal,
          })

          details.generationTime = Math.max(
            Math.floor(performance.now() - startTime - details.latency),
            0,
          )
          details.warnings = result.warnings
          details.providerMetadata = result.providerMetadata
          const { headers: _, body: __, ...responseMetadata } = result.response
          details.responseMetadata = responseMetadata

          await expenseManager.billGeneration(
            {
              type: 'transcription',
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
    log.error('Call transcription model error', error)
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
