import type {
  EmbeddingModelV2,
  ImageModelV2,
  LanguageModelV2,
  SpeechModelV2,
  TranscriptionModelV2,
} from '@ai-sdk/provider'

export interface Provider {
  languageModel?(modelId: string): LanguageModelV2

  textEmbeddingModel?(modelId: string): EmbeddingModelV2<string>

  image?(modelId: string): ImageModelV2

  transcriptionModel?(modelId: string): TranscriptionModelV2

  speechModel?(modelId: string): SpeechModelV2
}

export const modelTypes = ['language', 'text-embedding', 'image'] as const
export type ModelType = (typeof modelTypes)[number]

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  // | 'azure'
  // | 'bedrock'
  | 'google'
  | 'vertex'
  | 'mistral'
  | 'xai'
  | 'togetherai'
  | 'cohere'
  | 'fireworks'
  | 'deepinfra'
  | 'cerebras'
  | 'groq'
  | 'replicate'
  | 'perplexity'
  | 'luma'
  | 'openrouter'

export interface ProviderInfo {
  id: ProviderId
  name: string
  icon: string
  description: string
  languageModels?: ModelInfo[]
  imageModels?: ImageModelInfo[]
  speechModels?: SpeechModelInfo[]
  transcriptionModels?: TranscriptionModelInfo[]
  textEmbeddingModels?: EmbeddingModelInfo[]
}

export interface BaseModelInfo {
  id: string
  name: string
  description: string
}

export interface ModelInfo extends BaseModelInfo {
  contextWindow?: number // max tokens including input and output tokens
  maxOutputTokens?: number // max output tokens
  inputTokenPrice?: string // decimal string, in $USD/M input token
  cachedInputTokenPrice?: string // read; decimal string, in $USD/M cached input token
  cacheInputTokenPrice?: string | Record<string, string> // write; ttl => price; decimal string, in $USD/M cached input token
  outputTokenPrice?: string // decimal string, in $USD/M input token
  dimensions?: number // for embedding models
}

export interface ImageModelInfo extends BaseModelInfo {
  imageInputTokenPrice?: string
  imageCachedInputTokenPrice?: string
  imageOutputTokenPrice?: string
  textInputTokenPrice?: string
  textCachedInputTokenPrice?: string
  pricePerImage?:
    | string
    | Record<string, string> // quality => price
    | Record<string, Record<string, string>> // quality => size (or aspect ratio) => price
}

export interface SpeechModelInfo extends BaseModelInfo {
  maxInputTokens?: number // max input tokens
  textTokenPrice?: string // input token price
  audioTokenPrice?: string // output token price
}

export interface TranscriptionModelInfo extends BaseModelInfo {
  audioTokenPrice?: string // audio input token price
  textInputTokenPrice?: string // text input token price
  textOutputTokenPrice?: string // text output token price
}

export interface EmbeddingModelInfo extends BaseModelInfo {
  tokenPrice?: string
  dimensions?: number
}
