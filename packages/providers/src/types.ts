import type {
  EmbeddingModelV2,
  ImageModelV2,
  LanguageModelV2,
  SpeechModelV2,
  TranscriptionModelV2,
} from '@ai-sdk/provider'
import { Decimal } from 'decimal.js'
import { z } from 'zod/v4'

export interface Provider {
  languageModel?(modelId: string): LanguageModelV2

  imageModel?(modelId: string): ImageModelV2

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
  | 'openrouter'
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
  | 'vercel'
  | 'fal'
  | 'elevenlabs'
  | 'lmnt'

export const providerIds = [
  'openai',
  'anthropic',
  'google',
  'openrouter',
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
  'vercel',
  'fal',
  'elevenlabs',
  'lmnt',
] as const

export const providerIdSchema = z.enum(providerIds)

const _: ProviderId = '' as z.infer<typeof providerIdSchema>
const __: z.infer<typeof providerIdSchema> = '' as ProviderId

export type ModelFullId = `${ProviderId}:${string}`
export const modelFullIdSchema = z.templateLiteral(
  [
    providerIdSchema,
    ':',
    z.string().min(1),
  ],
  'Invalid model ID',
)

export function modelFullId(providerId: ProviderId, modelId: string): ModelFullId {
  return `${providerId}:${modelId}`
}

export function splitModelFullId(fullId: ModelFullId | string) {
  const index = fullId.indexOf(':')
  const providerId = index >= 0 ? fullId.slice(0, index) : ''
  const modelId = index >= 0 ? fullId.slice(index + 1) : fullId
  return { providerId, modelId } as { providerId: ProviderId; modelId: string }
}

export type ProviderInfo = BaseProviderInfo & ModelInfos

export interface BaseProviderInfo {
  id: ProviderId
  name: string
  icon: string
  description: string
  isGateway?: boolean // whether it is a gateway provider like OpenRouter
}

export type ExtendedBaseProviderInfo = BaseProviderInfo & {
  modelSeparator?: (modelPrefixedId: string) => { prefix: string; modelId: string } // for gateway providers, how to split model ID by prefix
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
  chargeable?: boolean // whether usage is chargeable by Cared credits
}

export type Modality = 'text' | 'image' | 'audio' | 'video' | 'pdf'
export const modalities = ['text', 'image', 'audio', 'video', 'pdf'] as const

export interface LanguageModelInfo extends BaseModelInfo {
  contextWindow?: number // max tokens including input and output tokens
  maxOutputTokens?: number // max output tokens
  inputTokenPrice?: string // decimal string, in $USD/M input token
  cachedInputTokenPrice?: string // read; decimal string, in $USD/M cached input token
  cacheInputTokenPrice?: string | [string, string][] // write; ttl => price; decimal string, in $USD/M cached input token
  outputTokenPrice?: string // decimal string, in $USD/M input token

  modality?: {
    input?: Modality[] // 'text' if not specified
    output?: Modality[] // 'text' if not specified
  }
}

export interface ImageModelInfo extends BaseModelInfo {
  imageInputTokenPrice?: string
  imageCachedInputTokenPrice?: string
  imageOutputTokenPrice?: string
  textInputTokenPrice?: string
  textCachedInputTokenPrice?: string
  pricePerImage?:
    | string
    | [string, string][] // quality => price
    | [string, [string, string][]][] // quality => size (or aspect ratio) => price
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
  dimensions?: number | number[]
}

export const baseModelInfoSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  deprecated: z.boolean().optional(),
  retired: z.boolean().optional(),
  chargeable: z.boolean().optional(),
})

export function formatModelPrice(price: string) {
  try {
    const p = new Decimal(price)
    if (p.isPositive()) {
      return p.toString()
    } else {
      return '0.00'
    }
  } catch {
    return
  }
}

export const modelPriceSchema = z.string().refine((p) => !!formatModelPrice(p), {
  message: 'Invalid price',
})

export const languageModelInfoSchema = baseModelInfoSchema.extend({
  contextWindow: z.int().min(0).optional(),
  maxOutputTokens: z.int().min(0).optional(),
  inputTokenPrice: modelPriceSchema.optional(),
  cachedInputTokenPrice: modelPriceSchema.optional(),
  cacheInputTokenPrice: modelPriceSchema
    .or(
      z
        .array(z.tuple([z.string().min(1, 'TTL is required'), modelPriceSchema]))
        .min(1, 'At least one TTL is required'),
    )
    .optional(),
  outputTokenPrice: modelPriceSchema.optional(),
  modality: z
    .object({
      input: z.array(z.enum(modalities)).optional(),
      output: z.array(z.enum(modalities)).optional(),
    })
    .optional(),
})

export const imageModelInfoSchema = baseModelInfoSchema.extend({
  imageInputTokenPrice: modelPriceSchema.optional(),
  imageCachedInputTokenPrice: modelPriceSchema.optional(),
  imageOutputTokenPrice: modelPriceSchema.optional(),
  textInputTokenPrice: modelPriceSchema.optional(),
  textCachedInputTokenPrice: modelPriceSchema.optional(),
  pricePerImage: modelPriceSchema
    .or(
      z
        .array(z.tuple([z.string().min(1, 'Quality is required'), modelPriceSchema]))
        .min(1, 'At least one quality is required'),
    )
    .or(
      z
        .array(
          z.tuple([
            z.string().min(1, 'Quality is required'),
            z
              .array(z.tuple([z.string().min(1, 'Size is required'), modelPriceSchema]))
              .min(1, 'At least one size is required'),
          ]),
        )
        .min(1),
    )
    .optional(),
})

export const speechModelInfoSchema = baseModelInfoSchema.extend({
  maxInputTokens: z.int().min(0).optional(),
  textTokenPrice: modelPriceSchema.optional(),
  audioTokenPrice: modelPriceSchema.optional(),
})

export const transcriptionModelInfoSchema = baseModelInfoSchema.extend({
  audioTokenPrice: modelPriceSchema.optional(),
  textInputTokenPrice: modelPriceSchema.optional(),
  textOutputTokenPrice: modelPriceSchema.optional(),
})

export const embeddingModelInfoSchema = baseModelInfoSchema.extend({
  tokenPrice: modelPriceSchema.optional(),
  dimensions: z
    .int()
    .min(0)
    .or(z.array(z.int().min(0)))
    .optional(),
})

export const modelInfosSchema = z.object({
  languageModels: z.array(languageModelInfoSchema).optional(),
  imageModels: z.array(imageModelInfoSchema).optional(),
  speechModels: z.array(speechModelInfoSchema).optional(),
  transcriptionModels: z.array(transcriptionModelInfoSchema).optional(),
  textEmbeddingModels: z.array(embeddingModelInfoSchema).optional(),
})

export interface ProviderSettings {
  enabled?: boolean
}

export interface ProvidersSettings {
  providers: Partial<Record<ProviderId, ProviderSettings>>
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
        apiKey: z.string().min(1, 'API key is required'), // encrypted in db
      }),

      z.object({
        providerId: z.literal('azure'),
        apiKey: z.string().min(1, 'API key is required'), // encrypted in db
        baseUrl: z.url(),
        apiVersion: z.string().min(1, 'API version is required').optional(),
      }),

      z.object({
        providerId: z.literal('bedrock'),
        region: z.string().min(1, 'Region is required'),
        accessKeyId: z.string().min(1, 'Access key ID is required'), // encrypted in db
        secretAccessKey: z.string().min(1, 'Secret access key is required'), // encrypted in db
      }),

      z.object({
        providerId: z.literal('vertex'),
        location: z.string().min(1, 'Location is required').optional(),
        serviceAccountJson: z
          .string()
          .min(1, 'Service account JSON is required')
          .refine(
            (json) => {
              try {
                const serviceAccount = JSON.parse(json.replace(/\s+/g, ''))
                const result = googleServiceAccountSchema.safeParse(serviceAccount)
                return result.success
              } catch {
                return false
              }
            },
            {
              message: 'Invalid service account JSON format',
            },
          ), // encrypted in db
      }),

      z.object({
        providerId: z.literal('replicate'),
        apiToken: z.string().min(1, 'API token is required'), // encrypted in db
      }),
    ]),
  )
