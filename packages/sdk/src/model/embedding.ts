import type { EmbeddingModelV2 } from '@ai-sdk/provider'

import { deserializeError, SuperJSON } from '@cared/shared'

import type { CaredClientOptions } from '../client'
import type { NonMethodProperties } from './language'
import { makeHeaders } from '../client'
import { responseJson } from './language'

export async function createEmbeddingModel(
  modelId: string,
  opts: CaredClientOptions,
): Promise<EmbeddingModelV2<string>> {
  const url = opts.apiUrl + '/api/v1/model/embedding'

  const getUrl = new URL(url)
  getUrl.searchParams.set('modelId', modelId)
  const attributes = await responseJson(
    await fetch(getUrl, {
      headers: await makeHeaders(opts),
    }),
  )

  return {
    ...(attributes as NonMethodProperties<EmbeddingModelV2<string>>),

    doEmbed: async ({
      abortSignal,
      ...options
    }: Parameters<EmbeddingModelV2<string>['doEmbed']>[0]) => {
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
        throw new Error(`doEmbed error (${response.status}): ${errorText}`)
      }

      return await responseJson(response)
    },
  }
}
