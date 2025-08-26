import type {
  EmbeddingModelV2,
  ImageModelV2,
  LanguageModelV2,
  SpeechModelV2,
  TranscriptionModelV2,
} from '@ai-sdk/provider'
import { bedrock, createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { azure, createAzure } from '@ai-sdk/azure'
import { cerebras, createCerebras } from '@ai-sdk/cerebras'
import { cohere, createCohere } from '@ai-sdk/cohere'
import { createDeepInfra, deepinfra } from '@ai-sdk/deepinfra'
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek'
import { createFireworks, fireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createVertex, vertex } from '@ai-sdk/google-vertex/edge' // for Edge Runtime
import { createGroq, groq } from '@ai-sdk/groq'
import { createLuma, luma } from '@ai-sdk/luma'
import { createMistral, mistral } from '@ai-sdk/mistral'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createPerplexity, perplexity } from '@ai-sdk/perplexity'
import { createReplicate, replicate } from '@ai-sdk/replicate'
import { createTogetherAI, togetherai } from '@ai-sdk/togetherai'
import { createXai, xai } from '@ai-sdk/xai'
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider'

import { splitModelFullId } from './index'
import { googleServiceAccountSchema, ModelType, Provider, ProviderId, ProviderKey } from './types'

export const providers: Record<ProviderId, Provider> = {
  openai: openai,
  anthropic: anthropic,
  google: google,
  vertex: vertex,
  azure: azure,
  bedrock: bedrock,
  deepseek: deepseek,
  mistral: mistral,
  xai: xai,
  togetherai: togetherai,
  cohere: cohere,
  fireworks: fireworks,
  deepinfra: deepinfra,
  cerebras: cerebras,
  groq: groq,
  replicate: replicate,
  perplexity: perplexity,
  luma: luma,
  openrouter: openrouter,
}

export {
  createOpenAI,
  createAnthropic,
  createGoogleGenerativeAI,
  createVertex,
  createAzure,
  createAmazonBedrock,
  createDeepSeek,
  createMistral,
  createXai,
  createTogetherAI,
  createCohere,
  createFireworks,
  createDeepInfra,
  createCerebras,
  createGroq,
  createReplicate,
  createPerplexity,
  createLuma,
  createOpenRouter,
}

const creators = {
  openai: createOpenAI,
  anthropic: createAnthropic,
  deepseek: createDeepSeek,
  azure: createAzure,
  bedrock: createAmazonBedrock,
  google: createGoogleGenerativeAI,
  vertex: createVertex,
  mistral: createMistral,
  xai: createXai,
  togetherai: createTogetherAI,
  cohere: createCohere,
  fireworks: createFireworks,
  deepinfra: createDeepInfra,
  cerebras: createCerebras,
  groq: createGroq,
  replicate: createReplicate,
  perplexity: createPerplexity,
  luma: createLuma,
  openrouter: createOpenRouter,
}

/**
 * Get model instance by model full ID and type
 * @param fullId Full model ID in format 'providerId:modelId'
 * @param modelType Type of model to get (language/text-embedding/image)
 * @returns Model instance of specified type, or undefined if not found
 */
export function getModel<T extends ModelType>(
  fullId: string,
  modelType: T,
  key?: ProviderKey,
): T extends 'language'
  ? LanguageModelV2 | undefined
  : T extends 'image'
    ? ImageModelV2 | undefined
    : T extends 'speech'
      ? SpeechModelV2 | undefined
      : T extends 'transcription'
        ? TranscriptionModelV2 | undefined
        : T extends 'textEmbedding'
          ? EmbeddingModelV2<string> | undefined
          : never {
  const { providerId, modelId } = splitModelFullId(fullId)
  let provider = providers[providerId]
  if (key) {
    switch (key.providerId) {
      case 'azure':
        provider = createAzure({
          baseURL: key.baseUrl,
          apiKey: key.apiKey,
          apiVersion: key.apiVersion,
        })
        break
      case 'bedrock':
        provider = createAmazonBedrock({
          baseURL: key.baseUrl,
          region: key.region,
          accessKeyId: key.accessKeyId,
          secretAccessKey: key.secretAccessKey,
        })
        break
      case 'vertex': {
        const serviceAccount = JSON.parse(key.serviceAccountJson.replace(/\s+/g, ''))
        const sa = googleServiceAccountSchema.parse(serviceAccount)
        provider = createVertex({
          baseURL: key.baseUrl,
          location: key.location,
          project: sa.project_id,
          googleCredentials: {
            clientEmail: sa.client_email,
            privateKey: sa.private_key,
            privateKeyId: sa.private_key_id,
          },
        })
        break
      }
      case 'replicate':
        provider = createReplicate({
          baseURL: key.baseUrl,
          apiToken: key.apiToken,
        })
        break
      default: {
        const creator = creators[key.providerId]
        provider = creator({
          apiKey: key.apiKey,
          baseURL: key.baseUrl,
        })
        break
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!provider) {
    return undefined as any
  }
  if (modelType === 'language') {
    return provider.languageModel?.(modelId) as any
  } else if (modelType === 'image') {
    return provider.imageModel?.(modelId) as any
  } else if (modelType === 'speech') {
    return provider.speechModel?.(modelId) as any
  } else if (modelType === 'transcription') {
    return provider.transcriptionModel?.(modelId) as any
  } else {
    return provider.textEmbeddingModel?.(modelId) as any
  }
}
