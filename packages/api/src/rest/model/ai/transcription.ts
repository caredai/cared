import type { NextRequest } from 'next/server'
import { z } from 'zod/v4'

import log from '@cared/log'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema } from '@cared/shared'

import { makeResponseJson, requestJson } from './language'

// Schema for TranscriptionModelV2 call options
const transcriptionModelV2CallOptionsSchema = z.object({
  audio: z.union([
    z.instanceof(Uint8Array),
    z.string(), // base64 encoded audio
  ]),
  mediaType: z.string(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
  headers: z.record(z.string(), z.string().or(z.undefined())).optional(),
})

// Request schema
const requestArgsSchema = z.object({
  modelId: z.string(),
  ...transcriptionModelV2CallOptionsSchema.shape,
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
  if (!model) {
    return new Response('Model not found', {
      status: 404,
    })
  }

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
          errors: validatedArgs.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      )
    }

    const { modelId, ...transcriptionModelV2CallOptions } = validatedArgs.data

    const model = getModel(modelId, 'transcription')
    if (!model) {
      return new Response('Model not found', {
        status: 404,
      })
    }

    try {
      const result = await model.doGenerate({
        ...transcriptionModelV2CallOptions,
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
    log.error('Call transcription model error', error)
    return makeResponseJson(
      {
        error: error.message || 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}
