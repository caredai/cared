import { splitModelFullId } from '@cared/providers'
import { getModel } from '@cared/providers/providers'
import { deserializeError, SuperJSON } from '@cared/shared'

import type { CaredClientOptions } from '../client'
import type { ImageModelV2, ImageModelV2CallOptions } from '@ai-sdk/provider'
import { makeHeaders } from '../client'
import { responseJson } from './language'

export function createImageModel(modelFullId: string, opts: CaredClientOptions): ImageModelV2 {
  const {
    // eslint-disable-next-line @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars
    doGenerate,
    maxImagesPerCall,
    ...modelConfig
  } = getModel(modelFullId, 'image')

  const url = opts.apiUrl + '/v1/model/image'

  return {
    ...modelConfig,

    maxImagesPerCall: async () => {
      if (typeof maxImagesPerCall !== 'function') {
        return maxImagesPerCall
      } else {
        const { modelId } = splitModelFullId(modelFullId)
        const gotMaxImagesPerCall = maxImagesPerCall({
          modelId,
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!(gotMaxImagesPerCall as PromiseLike<any>).then) {
          return gotMaxImagesPerCall as number | undefined
        }
      }

      const getUrl = new URL(url)
      getUrl.searchParams.set('modelId', modelFullId)
      const { maxImagesPerCall: gotMaxImagesPerCall } = await responseJson(
        await fetch(getUrl, {
          headers: await makeHeaders(opts),
        }),
      )
      return gotMaxImagesPerCall as number | undefined
    },

    doGenerate: async ({ abortSignal, ...options }: ImageModelV2CallOptions) => {
      const headers = await makeHeaders(opts)
      headers.set('Content-Type', 'application/json')

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: SuperJSON.stringify({
          modelId: modelFullId,
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
