import type { NextRequest } from 'next/server'
import { after } from 'next/server'
import { z } from 'zod/v4'

import type { SpeechGenerationDetails } from '@cared/providers'
import log from '@cared/log'
import { createCustomJsonFetch } from '@cared/providers'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema } from '@cared/shared'

import type { TelemetrySettings } from '../../../telemetry'
import type { SpeechModelV2CallOptions } from '@ai-sdk/provider'
import { authenticate } from '../../../auth'
import { ExpenseManager, findProvidersByModel, ProviderKeyManager } from '../../../operation'
import {
  getTracer,
  langfuseSpanProcessor,
  recordErrorOnSpan,
  recordSpan,
  selectTelemetryAttributes,
  stringifyForTelemetry,
} from '../../../telemetry'
import { authId, handleError, makeResponseJson, requestJson } from './language'

// Schema for SpeechModelV2 call options
const speechModelV2CallOptionsSchema = z.object({
  text: z.string(),
  voice: z.string().optional(),
  outputFormat: z.string().optional(),
  instructions: z.string().optional(),
  speed: z.number().optional(),
  language: z.string().optional(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
  // headers: z.record(z.string(), z.string().or(z.undefined())).optional(),
})

// Request schema
const requestArgsSchema = z.object({
  modelId: z.string(),
  ...speechModelV2CallOptionsSchema.shape,

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

  const model = getModel(modelId, 'speech')

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

    const { modelId, payerOrganizationId, ...speechModelV2CallOptions } = validatedArgs.data

    const auth = await authenticate()
    if (!auth.isAuthenticated()) {
      return new Response('Unauthorized', { status: 401 })
    }

    const telemetry: TelemetrySettings = {
      isEnabled: true,
    }
    const tracer = getTracer(telemetry)

    const expenseManager = ExpenseManager.from({
      auth: auth.auth!,
      payerOrganizationId,
    })

    // Allow modelId without provider prefix
    const models = await recordSpan({
      name: 'findProvidersByModel',
      attributes: selectTelemetryAttributes({
        telemetry,
        attributes: {
          'langfuse.trace.name': 'Speech Generate',
          'langfuse.user.id': authId(auth.auth!),
        },
      }),
      tracer,
      fn: async () => await findProvidersByModel(auth.auth!, modelId, 'speech'),
    })
    log.info(
      `Input model id: ${modelId}, resolved model ids: ${models.map((m) => m.id).join(', ')}`,
    )

    let lastError: Error | undefined

    for (const modelInfo of models) {
      const modelId = modelInfo.id

      const keyManager = await recordSpan({
        name: 'findAPIKeysByProvider',
        attributes: {},
        tracer,
        fn: async () => {
          return await ProviderKeyManager.from({
            auth: auth.auth!,
            modelId,
            onlyByok: !modelInfo.chargeable,
          })
        },
      })

      const keys = keyManager.selectKeys()

      for (const key of keys) {
        log.info(`Using provider key ${key.id} for model ${modelId}`)

        await recordSpan({
          name: 'canAfford',
          attributes: selectTelemetryAttributes({
            telemetry,
            attributes: {},
          }),
          tracer,
          fn: async () => {
            await expenseManager.canAfford(
              {
                type: 'speech',
                ...modelInfo,
              },
              {
                type: 'speech',
                ...(speechModelV2CallOptions as SpeechModelV2CallOptions),
              },
              key.byok,
            )
          },
        })

        const { text: _, instructions: __, ...callOptions_ } = speechModelV2CallOptions

        const details = {
          modelId,
          byok: key.byok,
          latency: 0,
          generationTime: 0,

          type: 'speech',
          callOptions: callOptions_,
        } as SpeechGenerationDetails

        const customFetch = createCustomJsonFetch({
          onLatency: (latency) => {
            details.latency = latency
          },
        })

        const model = getModel(modelId, 'speech', key.key, customFetch)

        const input = stringifyForTelemetry([
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: speechModelV2CallOptions.text,
              },
            ],
          },
        ])

        const result = await recordSpan({
          name: 'doGenerate',
          attributes: selectTelemetryAttributes({
            telemetry,
            attributes: {
              'gen_ai.operation.name': 'generate_content',
              'gen_ai.provider.name': model.provider,
              'gen_ai.request.model': model.modelId,
              'gen_ai.request.voice': speechModelV2CallOptions.voice,
              'gen_ai.request.outputFormat': speechModelV2CallOptions.outputFormat,
              'gen_ai.request.instructions': speechModelV2CallOptions.instructions,
              'gen_ai.request.speed': speechModelV2CallOptions.speed,
              'gen_ai.request.language': speechModelV2CallOptions.language,
              'langfuse.observation.type': 'generation',
              'langfuse.trace.input': {
                input: () => input,
              },
              'langfuse.observation.input': {
                input: () => input,
              },
            },
          }),
          tracer,
          fn: async (span) => {
            try {
              const startTime = performance.now()

              const result = await model.doGenerate({
                ...speechModelV2CallOptions,
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

              expenseManager.billGeneration(
                {
                  type: 'speech',
                  ...modelInfo,
                },
                details,
              )

              keyManager.updateState(key, {
                success: true,
                latency: details.latency,
              })

              keyManager.saveState()

              span.setAttributes(
                selectTelemetryAttributes({
                  telemetry,
                  attributes: {
                    'gen_ai.response.model': details.responseMetadata.modelId,
                    // TODO
                  },
                }),
              )

              return makeResponseJson(result)
            } catch (error: any) {
              recordErrorOnSpan(span, error)
              lastError = error
              if (handleError(keyManager, key, error, details)) {
                return false
              } else {
                keyManager.saveState()
                throw error
              }
            }
          },
        })

        if (result === false) {
          // Try the next model/key if available
          continue
        }

        return result
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
    log.error('Call speech model error', error)
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
  } finally {
    after(langfuseSpanProcessor.forceFlush())
  }
}
