import type {
  EmbeddingModelV2,
  ImageModelV2,
  LanguageModelV2,
  SpeechModelV2,
  TranscriptionModelV2,
} from '@ai-sdk/provider'
import { z } from 'zod/v4'

export interface Provider {
  languageModel?(modelId: string): LanguageModelV2

  textEmbeddingModel?(modelId: string): EmbeddingModelV2<string>

  image?(modelId: string): ImageModelV2

  transcriptionModel?(modelId: string): TranscriptionModelV2

  speechModel?(modelId: string): SpeechModelV2
}

export const modelTypes = ['language', 'text-embedding', 'image'] as const
export type ModelType = (typeof modelTypes)[number]

export const providerIds = [
  'openai',
  'anthropic',
  'google',
  'vertex',
  'azure',
  'bedrock',
  'deepseek',
  'mistral',
  'xai',
  'togetherai',
  'cohere',
  'fireworks',
  'deepinfra',
  'cerebras',
  'groq',
  'replicate',
  'perplexity',
  'luma',
  'openrouter',
] as const

export const providerIdSchema = z.enum(providerIds)
export type ProviderId = (typeof providerIds)[number]

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

export interface ProviderSettings {
  // TODO
  providers: Record<ProviderId, any>
}

export type ProviderKey = z.infer<typeof providerKeySchema>

export const providerKeySchema = z
  .object({
    apiKey: z.string(), // encrypted in db
    baseUrl: z.string().optional(),
  })
  .and(
    z.discriminatedUnion('providerId', [
      z.object({
        providerId: z.enum(providerIds).exclude(['azure', 'bedrock', 'vertex', 'replicate']),
      }),

      z.object({
        providerId: z.literal('azure'),
        baseUrl: z.string(),
        apiVersion: z.string().optional(),
      }),

      z.object({
        providerId: z.literal('bedrock'),
        apiKey: z.never(),
        region: z.string(),
        accessKeyId: z.string(), // encrypted in db
        secretAccessKey: z.string(), // encrypted in db
      }),

      z.object({
        providerId: z.literal('vertex'),
        apiKey: z.never(),
        project: z.string().optional(),
        location: z.string().optional(),
        clientEmail: z.string(), // encrypted in db
        privateKey: z.string(), // encrypted in db
        privateKeyId: z.string().optional(), // encrypted in db
      }),

      z.object({
        providerId: z.literal('replicate'),
        apiKey: z.never(),
        apiToken: z.string(), // encrypted in db
      }),
    ]),
  )
