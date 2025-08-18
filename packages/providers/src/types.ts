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

  image?(modelId: string): ImageModelV2

  speechModel?(modelId: string): SpeechModelV2

  transcriptionModel?(modelId: string): TranscriptionModelV2

  textEmbeddingModel?(modelId: string): EmbeddingModelV2<string>
}

export const modelTypes = [
  'language',
  'image',
  'speech',
  'transcription',
  'textEmbedding',
] as const
export type ModelType = (typeof modelTypes)[number]

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'vertex'
  | 'azure'
  | 'bedrock'
  | 'deepseek'
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

const _: ProviderId = '' as z.infer<typeof providerIdSchema>
const __: z.infer<typeof providerIdSchema> = '' as ProviderId

export type ModelFullId = `${ProviderId}:${string}`
export const modelFullIdSchema = z.templateLiteral([
  providerIdSchema,
  ':',
  z.string().min(1),
])

export function modelFullId(providerId: ProviderId, modelId: string): ModelFullId {
  return `${providerId}:${modelId}`
}

export function splitModelFullId(fullId: ModelFullId | string) {
  const index = fullId.indexOf(':')
  const providerId = fullId.slice(0, index)
  const modelId = fullId.slice(index + 1)
  return { providerId, modelId } as { providerId: ProviderId; modelId: string }
}

export type ProviderInfo = BaseProviderInfo & ModelInfos

export interface BaseProviderInfo {
  id: ProviderId
  name: string
  icon: string
  description: string
}

export interface ModelInfos {
  languageModels?: LanguageModelInfo[]
  imageModels?: ImageModelInfo[]
  speechModels?: SpeechModelInfo[]
  transcriptionModels?: TranscriptionModelInfo[]
  textEmbeddingModels?: EmbeddingModelInfo[]
}

export interface BaseModelInfo {
  id: string
  name: string
  description: string
  deprecated?: boolean
  retired?: boolean
}

export interface LanguageModelInfo extends BaseModelInfo {
  contextWindow?: number // max tokens including input and output tokens
  maxOutputTokens?: number // max output tokens
  inputTokenPrice?: string // decimal string, in $USD/M input token
  cachedInputTokenPrice?: string // read; decimal string, in $USD/M cached input token
  cacheInputTokenPrice?: string | Record<string, string> // write; ttl => price; decimal string, in $USD/M cached input token
  outputTokenPrice?: string // decimal string, in $USD/M input token
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

export const baseModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  deprecated: z.boolean().optional(),
  retired: z.boolean().optional(),
})

export const languageModelInfoSchema = baseModelInfoSchema.extend({
  contextWindow: z.number().optional(),
  maxOutputTokens: z.number().optional(),
  inputTokenPrice: z.string().optional(),
  cachedInputTokenPrice: z.string().optional(),
  cacheInputTokenPrice: z.string().or(z.record(z.string(), z.string())).optional(),
  outputTokenPrice: z.string().optional(),
})

export const imageModelInfoSchema = baseModelInfoSchema.extend({
  imageInputTokenPrice: z.string().optional(),
  imageCachedInputTokenPrice: z.string().optional(),
  imageOutputTokenPrice: z.string().optional(),
  textInputTokenPrice: z.string().optional(),
  textCachedInputTokenPrice: z.string().optional(),
  pricePerImage: z
    .string()
    .or(z.record(z.string(), z.string()))
    .or(z.record(z.string(), z.record(z.string(), z.string())))
    .optional(),
})

export const speechModelInfoSchema = baseModelInfoSchema.extend({
  maxInputTokens: z.number().optional(),
  textTokenPrice: z.string().optional(),
  audioTokenPrice: z.string().optional(),
})

export const transcriptionModelInfoSchema = baseModelInfoSchema.extend({
  audioTokenPrice: z.string().optional(),
  textInputTokenPrice: z.string().optional(),
  textOutputTokenPrice: z.string().optional(),
})

export const embeddingModelInfoSchema = baseModelInfoSchema.extend({
  tokenPrice: z.string().optional(),
  dimensions: z.number().optional(),
})

export const modelInfosSchema = z.object({
  languageModels: z.array(languageModelInfoSchema).optional(),
  imageModels: z.array(imageModelInfoSchema).optional(),
  speechModels: z.array(speechModelInfoSchema).optional(),
  transcriptionModels: z.array(transcriptionModelInfoSchema).optional(),
  textEmbeddingModels: z.array(embeddingModelInfoSchema).optional(),
})

export interface ProviderSettings {
  // TODO
  providers: Record<ProviderId, any>
}

export type ProviderKey = z.infer<typeof providerKeySchema>

export const googleServiceAccountSchema = z.object({
  project_id: z.string(),
  client_email: z.string(),
  private_key: z.string(),
  private_key_id: z.string(),
})

export const providerKeySchema = z
  .object({
    baseUrl: z.url().optional(),
  })
  .and(
    z.discriminatedUnion('providerId', [
      z.object({
        providerId: providerIdSchema.exclude(['azure', 'bedrock', 'vertex', 'replicate']),
        apiKey: z.string().min(1), // encrypted in db
      }),

      z.object({
        providerId: z.literal('azure'),
        apiKey: z.string().min(1), // encrypted in db
        baseUrl: z.url(),
        apiVersion: z.string().min(1).optional(),
      }),

      z.object({
        providerId: z.literal('bedrock'),
        region: z.string().min(1),
        accessKeyId: z.string().min(1), // encrypted in db
        secretAccessKey: z.string().min(1), // encrypted in db
      }),

      z.object({
        providerId: z.literal('vertex'),
        location: z.string().min(1).optional(),
        serviceAccountJson: z.string().refine(
          (json) => {
            const serviceAccount = JSON.parse(json)
            const result = googleServiceAccountSchema.safeParse(serviceAccount)
            return result.success
          },
          {
            message: 'Invalid service account JSON format',
          },
        ), // encrypted in db
      }),

      z.object({
        providerId: z.literal('replicate'),
        apiToken: z.string().min(1), // encrypted in db
      }),
    ]),
  )
