import hash from 'stable-hash'

import type { LiteLLMModelInfo } from '../litellm'
import type { OpenRouterModelInfo } from '../openrouter'
import type { ProviderInfo } from '../types'
import { getLiteLLMModels } from '../litellm'
import { getOpenRouterModels } from '../openrouter'
import anthropicProvider from './anthropic'
// import azureProvider from './azure'
// import bedrockProvider from './bedrock'
import cerebrasProvider from './cerebras'
import cohereProvider from './cohere'
import deepinfraProvider from './deepinfra'
import deepseekProvider from './deepseek'
import fireworksProvider from './fireworks'
import googleProvider from './google'
import groqProvider from './groq'
import lumaProvider from './luma'
import mistralProvider from './mistral'
import openaiProvider from './openai'
import perplexityProvider from './perplexity'
import replicateProvider from './replicate'
import togetheraiProvider from './togetherai'
import vertexProvider from './vertex'
import xaiProvider from './xai'

let openrouterModelsSingleton: OpenRouterModelInfo[] | undefined
let litellmModelsSingleton: Record<string, Record<string, LiteLLMModelInfo>> | undefined
let providerInfosSingleton: ProviderInfo[]

/**
 * Get all provider information including dynamically fetched OpenRouter models
 * @returns Promise resolving to an array of provider information
 */
export async function getProviderInfos(): Promise<ProviderInfo[]> {
  const openrouterModels = await getOpenRouterModels()
  const litellmModels = await getLiteLLMModels()

  // Only rebuild the provider infos if models have changed
  if (
    hash(openrouterModels) !== hash(openrouterModelsSingleton) ||
    hash(litellmModels) !== hash(litellmModelsSingleton)
  ) {
    openrouterModelsSingleton = openrouterModels
    litellmModelsSingleton = litellmModels

    providerInfosSingleton = [
      openaiProvider,
      anthropicProvider,
      deepseekProvider,
      // azureProvider,
      // bedrockProvider,
      googleProvider,
      vertexProvider,
      mistralProvider,
      xaiProvider,
      togetheraiProvider,
      cohereProvider,
      fireworksProvider,
      deepinfraProvider,
      cerebrasProvider,
      groqProvider,
      replicateProvider,
      perplexityProvider,
      lumaProvider,
      {
        id: 'openrouter',
        name: 'OpenRouter',
        icon: 'openrouter.svg',
        description: 'OpenRouter API gateway providing access to various AI models',
        languageModels: openrouterModels,
      },
    ]

    for (const provider of providerInfosSingleton) {
      const info = litellmModels[provider.id]
      if (info) {
        for (const [modelId, modelInfo] of Object.entries(info)) {
          for (const model of [
            ...(provider.languageModels ?? []),
            ...(provider.imageModels ?? []),
            ...(provider.textEmbeddingModels ?? []),
          ]) {
            if (model.id === modelId) {
              model.contextWindow = modelInfo.max_input_tokens
              model.maxOutputTokens = modelInfo.max_output_tokens
              model.inputTokenPrice = modelInfo.input_cost_per_token?.toString()
              model.cachedInputTokenPrice = modelInfo.cache_read_input_token_cost?.toString()
              model.outputTokenPrice = modelInfo.output_cost_per_token?.toString()
            }
          }
        }
      }
    }
  }

  return providerInfosSingleton
}
