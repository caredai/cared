import type { TranscriptionModelV2, TranscriptionModelV2CallOptions } from '@ai-sdk/provider'

import { deserializeError, SuperJSON } from '@cared/shared'

import type { CaredClientOptions } from '../client'
import type { NonMethodProperties } from './language'
import { makeHeaders } from '../client'
import { responseJson } from './language'

export async function createTranscriptionModel(
  modelId: string,
  opts: CaredClientOptions,
): Promise<TranscriptionModelV2> {
  const url = opts.apiUrl + '/api/v1/model/transcription'

  const getUrl = new URL(url)
  getUrl.searchParams.set('modelId', modelId)
  const attributes = await responseJson(
    await fetch(getUrl, {
      headers: await makeHeaders(opts),
    }),
  )

  return {
    ...(attributes as NonMethodProperties<TranscriptionModelV2>),

    doGenerate: async ({ abortSignal, ...options }: TranscriptionModelV2CallOptions) => {
      const headers = await makeHeaders(opts)
      headers.set('Content-Type', 'application/json')

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: SuperJSON.stringify({
          modelId,
          ...options,
        }),
        signal: abortSignal,
      })
      if (!response.ok) {
        if (response.headers.get('Content-Type')?.startsWith('application/json')) {
          const errorJson = await responseJson(response)
          if (errorJson.errorSerialized) {
            throw deserializeError(errorJson.error)
          }
        }
        const errorText = await response.text()
        throw new Error(`doGenerate error (${response.status}): ${errorText}`)
      }

      return await responseJson(response)
    },
  }
}
