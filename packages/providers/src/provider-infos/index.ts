import type { OpenRouterModelInfo } from '../openrouter'
import type { ProviderInfo } from '../types'
import { getOpenRouterModels } from '../openrouter'
import anthropicProvider from './anthropic'
import azureProvider from './azure'
import bedrockProvider from './bedrock'
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
let providerInfosSingleton: ProviderInfo[]

/**
 * Get all provider information including dynamically fetched OpenRouter models
 * @returns Promise resolving to an array of provider information
 */
export async function getProviderInfos(): Promise<ProviderInfo[]> {
  const openrouterModels = await getOpenRouterModels()

  // Only rebuild the provider infos if OpenRouter models have changed
  if (openrouterModels !== openrouterModelsSingleton) {
    openrouterModelsSingleton = openrouterModels
    providerInfosSingleton = [
      openaiProvider,
      anthropicProvider,
      deepseekProvider,
      azureProvider,
      bedrockProvider,
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
  }

  return providerInfosSingleton
}
