import { getModel } from '@cared/providers/providers'
import { deserializeError, SuperJSON } from '@cared/shared'

import type { CaredClientOptions } from '../client'
import type { TranscriptionModelV2, TranscriptionModelV2CallOptions } from '@ai-sdk/provider'
import { makeHeaders } from '../client'
import { responseJson } from './language'

export function createTranscriptionModel(
  modelId: string,
  opts: CaredClientOptions,
): TranscriptionModelV2 {
  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doGenerate,
    ...modelConfig
  } = getModel(modelId, 'transcription')

  const url = opts.apiUrl + '/v1/model/transcription'

  return {
    ...modelConfig,

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
