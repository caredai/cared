import type { NextRequest } from 'next/server'
import { z } from 'zod/v4'

import log from '@cared/log'
import { getModel } from '@cared/providers/providers'
import { serializeError, sharedV2ProviderOptionsSchema } from '@cared/shared'

import { makeResponseJson, requestJson } from './language'

// Schema for ImageModelV2 call options
const imageModelV2CallOptionsSchema = z.object({
  prompt: z.string(),
  n: z.number(),
  size: z.templateLiteral([z.string(), 'x', z.string()], 'Invalid size').optional(),
  aspectRatio: z.templateLiteral([z.string(), ':', z.string()], 'Invalid aspect ratio').optional(),
  seed: z.number().optional(),
  providerOptions: sharedV2ProviderOptionsSchema.optional(),
  headers: z.record(z.string(), z.string().or(z.undefined())).optional(),
})

// Request schema
const requestArgsSchema = z.object({
  modelId: z.string(),
  ...imageModelV2CallOptionsSchema.shape,
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
  if (!model) {
    return new Response('Model not found', {
      status: 404,
    })
  }

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
          errors: validatedArgs.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      )
    }

    const { modelId, ...imageModelV2CallOptions } = validatedArgs.data

    const model = getModel(modelId, 'image')
    if (!model) {
      return new Response('Model not found', {
        status: 404,
      })
    }

    try {
      const result = await model.doGenerate({
        ...imageModelV2CallOptions,
        abortSignal: req.signal,
      } as any)
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
    log.error('Call image model error', error)
    return makeResponseJson(
      {
        error: error.message || 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}
