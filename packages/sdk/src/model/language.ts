import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2StreamPart,
} from '@ai-sdk/provider'

import { deserializeError, regexFromString, SuperJSON } from '@cared/shared'

import type { CaredClientOptions } from '../client'
import { makeHeaders } from '../client'

const NEWLINE = '\n'.charCodeAt(0)

function concatChunks(chunks: Uint8Array[], totalLength: number) {
  const concatenatedChunks = new Uint8Array(totalLength)

  let offset = 0
  for (const chunk of chunks) {
    concatenatedChunks.set(chunk, offset)
    offset += chunk.length
  }
  chunks.length = 0

  return concatenatedChunks
}

async function* processStream(
  responseBody: ReadableStream<Uint8Array>,
): AsyncGenerator<LanguageModelV2StreamPart | { type: 'metadata'; [key: string]: any }> {
  const reader = responseBody.getReader()
  const decoder = new TextDecoder()
  const chunks: Uint8Array[] = []
  let totalLength = 0

  while (true) {
    const { value } = await reader.read()

    if (value) {
      chunks.push(value)
      totalLength += value.length
      if (value[value.length - 1] !== NEWLINE) {
        // if the last character is not a newline, we have not read the whole JSON value
        continue
      }
    }

    if (chunks.length === 0) {
      break // we have reached the end of the stream
    }

    const concatenatedChunks = concatChunks(chunks, totalLength)
    totalLength = 0

    const streamParts = decoder
      .decode(concatenatedChunks, { stream: true })
      .split('\n')
      .filter((line) => line !== '') // splitting leaves an empty string at the end
      .map((line) => JSON.parse(line))

    for (const part of streamParts) {
      yield part
    }
  }
}

export type NonMethodProperties<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K]
}

export async function createLanguageModel(
  modelId: string,
  opts: CaredClientOptions,
): Promise<LanguageModelV2> {
  const url = opts.apiUrl + '/api/v1/model/language'

  const getUrl = new URL(url)
  getUrl.searchParams.set('modelId', modelId)
  const { supportedUrls, ...attributes } = await responseJson(
    await fetch(getUrl, {
      headers: await makeHeaders(opts),
    }),
  )

  return {
    ...(attributes as NonMethodProperties<LanguageModelV2>),

    supportedUrls: Object.fromEntries(
      (supportedUrls as [string, string[]][]).map(([mediaType, regexArray]) => [
        mediaType,
        regexArray.map(regexFromString).filter(Boolean),
      ]),
    ) as Record<string, RegExp[]>,

    doGenerate: async ({ abortSignal, ...options }: LanguageModelV2CallOptions) => {
      const headers = await makeHeaders(opts)
      headers.set('Content-Type', 'application/json')

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: SuperJSON.stringify({
          modelId,
          stream: false,
          ...options,
        }),
        signal: abortSignal,
      })
      if (!response.ok) {
        if (response.headers.get('Content-Type')?.startsWith('application/json')) {
          const errorJson = await responseJson(response)
          if (errorJson.errorSerialized) {
            throw deserializeError(errorJson.error)
          } else if (typeof errorJson.error === 'string') {
            throw new Error(errorJson.error)
          }
        } else {
          const errorText = await response.text()
          throw new Error(`doGenerate error (${response.status}): ${errorText}`)
        }
      }

      return await responseJson(response)
    },

    doStream: async ({ abortSignal, ...options }: LanguageModelV2CallOptions) => {
      const headers = await makeHeaders(opts)
      headers.set('Content-Type', 'application/json')

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: SuperJSON.stringify({
          modelId,
          stream: true,
          ...options,
        }),
        signal: abortSignal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`doStream error (${response.status}): ${errorText}`)
      }

      // Process the stream to extract metadata and forward content
      let metadata = {} as Omit<Awaited<ReturnType<LanguageModelV2['doStream']>>, 'stream'>
      let contentStreamStarted = false

      // Create an async generator that separates metadata and content
      const generator = async function* () {
        for await (const chunk of processStream(response.body!)) {
          // console.log('processStream chunk:', chunk)
          if (chunk.type === 'metadata') {
            if (contentStreamStarted) {
              // Metadata should only come at the beginning
              console.warn('Received metadata after content stream started')
              continue
            }
            const { type: _type, ...meta } = chunk // Remove 'type' field
            metadata = {
              ...metadata, // Merge if multiple metadata chunks (unlikely but possible)
              ...meta,
            }
          } else {
            contentStreamStarted = true
            // Ensure it matches LanguageModelV2StreamPart before yielding
            if ('type' in chunk) {
              if (
                chunk.type === 'error' &&
                typeof chunk.error === 'string' &&
                (chunk as any).errorSerialized
              ) {
                delete (chunk as any).errorSerialized
                try {
                  chunk.error = deserializeError(chunk.error)
                } catch {
                  console.warn('Received unexpected error chunk format in content stream:', chunk)
                }
              }
              yield chunk
            } else {
              console.warn('Received unexpected chunk format in content stream:', chunk)
            }
          }
        }
      }

      const iterator = generator()

      return {
        stream: new ReadableStream({
          async pull(controller) {
            const { value, done } = await iterator.next()
            if (done) {
              controller.close()
            } else {
              controller.enqueue(value)
            }
          },
        }),
        ...metadata, // Spread the parsed metadata (warnings, usage, rawResponse etc.)
      }
    },
  }
}

export async function responseJson(response: Response): Promise<any> {
  return SuperJSON.deserialize(await response.json())
}
