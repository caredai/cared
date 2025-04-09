import type { LanguageModelV1, LanguageModelV1CallOptions, LanguageModelV1StreamPart } from 'ai'

import { makeHeaders } from '..'
import { env } from '../env'

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
): AsyncGenerator<LanguageModelV1StreamPart | { type: 'metadata'; [key: string]: any }> {
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

export async function createLanguageModel(
  modelId: string,
  opts:
    | {
        apiKey: string
      }
    | {
        userToken: string | (() => string | Promise<string>) // user access token
      },
): Promise<LanguageModelV1> {
  const url = env.OWNX_API_URL
    ? new URL(env.OWNX_API_URL).origin + '/api/v1/model/language'
    : 'https://ownx.ai/api/v1/model/language'

  const getUrl = new URL(url)
  getUrl.searchParams.set('modelId', modelId)
  const attributes = await (
    await fetch(getUrl, {
      headers: await makeHeaders(opts),
    })
  ).json()

  const [providerId] = modelId.split(':', 2)

  type NonMethodProperties<T> = {
    [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K]
  }

  return {
    ...(attributes as NonMethodProperties<LanguageModelV1>),

    supportsUrl: (url: URL) => {
      // TODO
      switch (providerId) {
        case 'google':
          return url
            .toString()
            .startsWith('https://generativelanguage.googleapis.com/v1beta/files/')
        case 'mistral':
          return url.protocol === 'https:'
        default:
          return false
      }
    },

    doGenerate: async (options: LanguageModelV1CallOptions) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          stream: false,
          ...options,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`doGenerate error (${response.status}): ${errorText}`)
      }
      return await response.json()
    },

    doStream: async (options: LanguageModelV1CallOptions) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          stream: true,
          ...options,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`doStream error (${response.status}): ${errorText}`)
      }

      // Process the stream to extract metadata and forward content
      let initialMetadata = {} as Omit<Awaited<ReturnType<LanguageModelV1['doStream']>>, 'stream'>
      let contentStreamStarted = false

      // Create an async generator that separates metadata and content
      const generator = async function* () {
        for await (const chunk of processStream(response.body!)) {
          if (chunk.type === 'metadata') {
            if (contentStreamStarted) {
              // Metadata should only come at the beginning
              console.warn('Received metadata after content stream started')
              continue
            }
            const { type: _type, ...meta } = chunk // Remove 'type' field
            initialMetadata = {
              ...initialMetadata, // Merge if multiple metadata chunks (unlikely but possible)
              ...meta,
            }
          } else {
            contentStreamStarted = true
            // Ensure it matches LanguageModelV1StreamPart before yielding
            if ('type' in chunk) {
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
        ...initialMetadata, // Spread the parsed metadata (warnings, usage, rawResponse etc.)
      }
    },
  }
}
