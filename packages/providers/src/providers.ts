import type { EmbeddingModelV1, ImageModelV1, LanguageModelV1 } from '@ai-sdk/provider'
import { bedrock, createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { azure, createAzure } from '@ai-sdk/azure'
import { cerebras, createCerebras } from '@ai-sdk/cerebras'
import { cohere, createCohere } from '@ai-sdk/cohere'
import { createDeepInfra, deepinfra } from '@ai-sdk/deepinfra'
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek'
import { createFireworks, fireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createVertex, vertex } from '@ai-sdk/google-vertex'
import { createGroq, groq } from '@ai-sdk/groq'
import { createLuma, luma } from '@ai-sdk/luma'
import { createMistral, mistral } from '@ai-sdk/mistral'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createPerplexity, perplexity } from '@ai-sdk/perplexity'
import { createReplicate, replicate } from '@ai-sdk/replicate'
import { createTogetherAI, togetherai } from '@ai-sdk/togetherai'
import { createXai, xai } from '@ai-sdk/xai'
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider'

import type { ModelType, Provider, ProviderId } from './types'
import { splitModelFullId } from './index'

export const providers: Record<ProviderId, Provider> = {
  openai: openai,
  anthropic: anthropic,
  deepseek: deepseek,
  azure: azure,
  bedrock: bedrock,
  google: google,
  vertex: vertex,
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
  createDeepSeek,
  createAzure,
  createAmazonBedrock,
  createGoogleGenerativeAI,
  createVertex,
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
  keys?: Record<string, string>,
): T extends 'language'
  ? LanguageModelV1 | undefined
  : T extends 'text-embedding'
    ? EmbeddingModelV1<string> | undefined
    : T extends 'image'
      ? ImageModelV1 | undefined
      : never {
  const { providerId, modelId } = splitModelFullId(fullId)
  let provider = providers[providerId]
  const key = keys?.[providerId]
  if (key) {
    const creator = creators[providerId]
    provider = creator({
      apiKey: key,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!provider) {
    return undefined as any
  }
  if (modelType === 'language') {
    return provider.languageModel?.(modelId) as any
  } else if (modelType === 'text-embedding') {
    return provider.textEmbeddingModel?.(modelId) as any
  } else {
    return provider.image?.(modelId) as any
  }
}
