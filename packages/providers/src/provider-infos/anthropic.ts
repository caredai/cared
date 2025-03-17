import type { ProviderInfo } from '../types'

/**
 * Anthropic provider information including all available Claude models
 */
const anthropicProvider: ProviderInfo = {
  id: 'anthropic',
  name: 'Anthropic',
  icon: 'anthropic.svg',
  description: 'Anthropic API services including Claude language models',
  languageModels: [
    {
      id: 'claude-3-5-sonnet-latest',
      name: 'Claude 3.5 Sonnet',
      description: 'Latest Claude 3.5 Sonnet model',
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Oct 2024)',
      description: 'October 2024 version of Claude 3.5 Sonnet',
    },
    {
      id: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet (Jun 2024)',
      description: 'June 2024 version of Claude 3.5 Sonnet',
    },
    {
      id: 'claude-3-5-haiku-latest',
      name: 'Claude 3.5 Haiku',
      description: 'Latest Claude 3.5 Haiku model',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku (Oct 2024)',
      description: 'October 2024 version of Claude 3.5 Haiku',
    },
    {
      id: 'claude-3-opus-latest',
      name: 'Claude 3 Opus',
      description: 'Latest Claude 3 Opus model',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'February 2024 version of Claude 3 Opus',
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      description: 'February 2024 version of Claude 3 Sonnet',
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      description: 'March 2024 version of Claude 3 Haiku',
    },
  ],
  textEmbeddingModels: [],
  imageModels: [],
}

export default anthropicProvider 
