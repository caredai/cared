import type { ProviderInfo } from '../types'

/**
 * Fireworks AI provider information including all available models
 */
const fireworksProvider: ProviderInfo = {
  id: 'fireworks',
  name: 'Fireworks AI',
  icon: 'fireworks.svg',
  description: 'Fireworks AI platform offering optimized open source models',
  languageModels: [
    {
      id: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
      name: 'Llama 3.1 405B',
      description: 'Largest Llama 3.1 model with 405B parameters',
    },
    {
      id: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      name: 'Llama 3.1 70B',
      description: 'Llama 3.1 model with 70B parameters',
    },
    {
      id: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
      name: 'Llama 3.1 8B',
      description: 'Llama 3.1 model with 8B parameters',
    },
    {
      id: 'accounts/fireworks/models/llama-v3-70b-instruct',
      name: 'Llama 3 70B',
      description: 'Llama 3 model with 70B parameters',
    },
    {
      id: 'accounts/fireworks/models/llama-v3-8b-instruct',
      name: 'Llama 3 8B',
      description: 'Llama 3 model with 8B parameters',
    },
    {
      id: 'accounts/fireworks/models/mixtral-8x7b-instruct',
      name: 'Mixtral 8x7B',
      description: 'Mixtral model with 8x7B parameters',
    },
    {
      id: 'accounts/fireworks/models/mixtral-8x22b-instruct',
      name: 'Mixtral 8x22B',
      description: 'Mixtral model with 8x22B parameters',
    },
    {
      id: 'accounts/fireworks/models/firefunction-v2',
      name: 'FireFunction v2',
      description: 'Specialized model for function calling',
    },
    {
      id: 'accounts/fireworks/models/firefunction-v1',
      name: 'FireFunction v1',
      description: 'First version of function calling model',
    },
    {
      id: 'accounts/fireworks/models/yi-34b-200k-capybara',
      name: 'Yi 34B Capybara',
      description: 'Yi model with 34B parameters and 200K context',
    },
    {
      id: 'accounts/fireworks/models/yi-34b-chat',
      name: 'Yi 34B Chat',
      description: 'Yi chat model with 34B parameters',
    },
    {
      id: 'accounts/fireworks/models/qwen2-72b-instruct',
      name: 'Qwen2 72B',
      description: 'Qwen2 model with 72B parameters',
    },
    {
      id: 'accounts/fireworks/models/qwen1.5-72b-chat',
      name: 'Qwen 1.5 72B',
      description: 'Qwen 1.5 model with 72B parameters',
    },
    {
      id: 'accounts/fireworks/models/qwen1.5-14b-chat',
      name: 'Qwen 1.5 14B',
      description: 'Qwen 1.5 model with 14B parameters',
    },
    {
      id: 'accounts/fireworks/models/qwen1.5-7b-chat',
      name: 'Qwen 1.5 7B',
      description: 'Qwen 1.5 model with 7B parameters',
    },
    {
      id: 'accounts/fireworks/models/llama-v2-70b-chat',
      name: 'Llama 2 70B',
      description: 'Llama 2 model with 70B parameters',
    },
    {
      id: 'accounts/fireworks/models/llama-v2-13b-chat',
      name: 'Llama 2 13B',
      description: 'Llama 2 model with 13B parameters',
    },
    {
      id: 'accounts/fireworks/models/llama-v2-7b-chat',
      name: 'Llama 2 7B',
      description: 'Llama 2 model with 7B parameters',
    },
    {
      id: 'accounts/fireworks/models/mistral-7b-instruct-4k',
      name: 'Mistral 7B 4K',
      description: 'Mistral model with 7B parameters and 4K context',
    },
  ],
  textEmbeddingModels: [
    {
      id: 'accounts/fireworks/models/nomic-embed-text-v1.5',
      name: 'Nomic Embed v1.5',
      description: 'Nomic text embedding model',
      dimensions: 768,
    },
    {
      id: 'accounts/fireworks/models/e5-large-v2',
      name: 'E5 Large v2',
      description: 'E5 large embedding model',
      dimensions: 1024,
    },
  ],
  imageModels: [],
}

export default fireworksProvider
