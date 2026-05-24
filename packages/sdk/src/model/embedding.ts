import { getModel } from '@cared/providers/providers'
import { deserializeError, SuperJSON } from '@cared/shared'

import type { CaredClientOptions } from '../client'
import type { EmbeddingModelV2 } from '@ai-sdk/provider'
import { makeHeaders } from '../client'
import { responseJson } from './language'

export function createEmbeddingModel(
  modelId: string,
  opts: CaredClientOptions,
): EmbeddingModelV2<string> {
  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doEmbed,
    maxEmbeddingsPerCall,
    supportsParallelCalls,
    ...modelConfig
  } = getModel(modelId, 'textEmbedding')

  const url = opts.apiUrl + '/v1/model/embedding'

  const getModelConfig = async () => {
    const getUrl = new URL(url)
    getUrl.searchParams.set('modelId', modelId)
    return await responseJson(
      await fetch(getUrl, {
        headers: await makeHeaders(opts),
      }),
    )
  }

  let getModelConfigPromise: Promise<any> | undefined = undefined

  return {
    ...modelConfig,

    maxEmbeddingsPerCall: (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!(maxEmbeddingsPerCall as PromiseLike<any>).then) {
        return maxEmbeddingsPerCall
      }

      getModelConfigPromise ??= getModelConfig()
      return (await getModelConfigPromise).maxEmbeddingsPerCall as number | undefined
    })(),

    supportsParallelCalls: (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!(supportsParallelCalls as PromiseLike<any>).then) {
        return supportsParallelCalls
      }

      getModelConfigPromise ??= getModelConfig()
      return (await getModelConfigPromise).supportsParallelCalls as boolean
    })(),

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
