import type { EncodeOptions } from 'gpt-tokenizer/GptEncoding'
import type { Model } from 'gpt-tokenizer/models'

addEventListener(
  'message',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (event: MessageEvent<{ id: number; modelId: string; text: string }>) => {
    const { id, modelId, text } = event.data
    try {
      const { models } = await import('gpt-tokenizer/models')
      let encoding = (models[modelId as keyof typeof models] as Model | undefined)?.encoding
      if (!encoding) {
        // https://github.com/niieani/gpt-tokenizer?tab=readme-ov-file#supported-models-and-their-encodings
        if (modelId.includes('o1') || modelId.includes('o3') || modelId.includes('gpt-4o')) {
          encoding = 'o200k_base'
        } else if (modelId.includes('gpt-3.5') || modelId.includes('gpt-4')) {
          encoding = 'cl100k_base'
        } else if (modelId.includes('text-davinci-003') || modelId.includes('text-davinci-002')) {
          encoding = 'p50k_base'
        } else if (modelId.includes('text-davinci-001')) {
          encoding = 'r50k_base'
        } else {
          encoding = 'cl100k_base'
        }
      }

      let encode: (lineToEncode: string, encodeOptions?: EncodeOptions) => number[]
      switch (encoding) {
        case 'o200k_base':
          encode = (await import('gpt-tokenizer/encoding/o200k_base')).encode
          break
        case 'cl100k_base':
          encode = (await import('gpt-tokenizer/encoding/cl100k_base')).encode
          break
        case 'p50k_base':
          encode = (await import('gpt-tokenizer/encoding/p50k_base')).encode
          break
        case 'r50k_base':
          encode = (await import('gpt-tokenizer/encoding/r50k_base')).encode
          break
        default:
          encode = (await import('gpt-tokenizer/encoding/cl100k_base')).encode
          break
      }

      const tokenCount = encode(text).length

      postMessage({ id, tokenCount })
    } catch (error) {
      postMessage({ id, error: (error as Error).message })
    }
  },
)
