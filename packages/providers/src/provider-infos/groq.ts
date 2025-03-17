import type { ProviderInfo } from '../types'

/**
 * Groq provider information including all available models
 */
const groqProvider: ProviderInfo = {
  id: 'groq',
  name: 'Groq',
  icon: 'groq.svg',
  description: 'Groq platform offering ultra-fast inference for language models',
  languageModels: [
    {
      id: 'llama3-8b-8192',
      name: 'Llama 3 8B',
      description: 'Llama 3 model with 8B parameters and 8K context',
    },
    {
      id: 'llama3-70b-8192',
      name: 'Llama 3 70B',
      description: 'Llama 3 model with 70B parameters and 8K context',
    },
    {
      id: 'llama3-1-8b-8192',
      name: 'Llama 3.1 8B',
      description: 'Llama 3.1 model with 8B parameters and 8K context',
    },
    {
      id: 'llama3-1-70b-8192',
      name: 'Llama 3.1 70B',
      description: 'Llama 3.1 model with 70B parameters and 8K context',
    },
    {
      id: 'llama3-1-405b-8192',
      name: 'Llama 3.1 405B',
      description: 'Llama 3.1 model with 405B parameters and 8K context',
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      description: 'Mixtral model with 8x7B parameters and 32K context',
    },
    {
      id: 'gemma-7b-it',
      name: 'Gemma 7B',
      description: 'Google Gemma model with 7B parameters',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Anthropic Claude 3 Opus model',
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      description: 'Anthropic Claude 3 Sonnet model',
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      description: 'Anthropic Claude 3 Haiku model',
    },
  ],
  textEmbeddingModels: [],
  imageModels: [],
}

export default groqProvider 