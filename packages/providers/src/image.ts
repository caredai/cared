import type { OpenAI } from 'openai'

import type { ProviderId } from './types'

// https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api#model-results
interface GoogleImagenResult {
  predictions: {
    // gcsUri?: string
    // bytesBase64Encoded?: string
    mimeType?: string
    raiFilteredReason?: string
    safetyAttributes?: {
      categories?: string[]
      scores?: number[]
    }
    prompt?: string
  }[]
}

export type ImageRawResponse =
  | ({
      providerId: 'openai'
    } & Omit<OpenAI.ImagesResponse, 'data'>)
  | ({
      providerId: 'google'
    } & GoogleImagenResult)
  | ({
      providerId: 'vertex'
    } & GoogleImagenResult)
  | {
      providerId: 'fal'
    }

export function extractImageRawResponse(providerId: ProviderId, response: Record<string, any>) {
  switch (providerId) {
    case 'openai': {
      const { data: _, ...rep } = response as OpenAI.ImagesResponse
      return {
        providerId,
        ...rep,
      }
    }
    case 'google':
    case 'vertex': {
      return {
        providerId,
        predictions: (
          response as (GoogleImagenResult['predictions'][number] & {
            gcsUri?: string
            bytesBase64Encoded?: string
          })[]
        ).map(({ gcsUri: _, bytesBase64Encoded: __, ...rep }) => rep),
      }
    }
    case 'fal': {
      return {
        providerId,
      }
    }
    default:
      return
  }
}
