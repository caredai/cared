import type { ProviderInfo } from '../types'

/**
 * Perplexity provider information including all available models
 */
const perplexityProvider: ProviderInfo = {
  id: 'perplexity',
  name: 'Perplexity',
  icon: 'perplexity.png',
  description:
    'Perplexity AI platform offering specialized language models for search and information retrieval',
  languageModels: [
    {
      id: 'pplx-70b-online',
      name: 'Perplexity Online 70B',
      description: 'Online model with 70B parameters and web search capabilities',
    },
    {
      id: 'pplx-7b-online',
      name: 'Perplexity Online 7B',
      description: 'Lightweight online model with 7B parameters and web search capabilities',
    },
    {
      id: 'pplx-70b-chat',
      name: 'Perplexity Chat 70B',
      description: 'Chat model with 70B parameters',
    },
    {
      id: 'pplx-7b-chat',
      name: 'Perplexity Chat 7B',
      description: 'Lightweight chat model with 7B parameters',
    },
    {
      id: 'llama-3-sonar-large-32k-online',
      name: 'Sonar Large 32K Online',
      description: 'Sonar large model with 32K context and web search capabilities',
    },
    {
      id: 'llama-3-sonar-small-32k-online',
      name: 'Sonar Small 32K Online',
      description: 'Sonar small model with 32K context and web search capabilities',
    },
    {
      id: 'llama-3-sonar-large-32k',
      name: 'Sonar Large 32K',
      description: 'Sonar large model with 32K context',
    },
    {
      id: 'llama-3-sonar-small-32k',
      name: 'Sonar Small 32K',
      description: 'Sonar small model with 32K context',
    },
    {
      id: 'mixtral-8x7b-instruct',
      name: 'Mixtral 8x7B',
      description: 'Mixtral model with 8x7B parameters',
    },
    {
      id: 'codellama-70b-instruct',
      name: 'CodeLlama 70B',
      description: 'CodeLlama model with 70B parameters',
    },
    {
      id: 'codellama-34b-instruct',
      name: 'CodeLlama 34B',
      description: 'CodeLlama model with 34B parameters',
    },
    {
      id: 'llama-3-70b-instruct',
      name: 'Llama 3 70B',
      description: 'Llama 3 model with 70B parameters',
    },
    {
      id: 'llama-3-8b-instruct',
      name: 'Llama 3 8B',
      description: 'Llama 3 model with 8B parameters',
    },
  ],
  textEmbeddingModels: [],
  imageModels: [],
}

export default perplexityProvider
