import type { ProviderInfo } from '../types'

/**
 * Mistral AI provider information including all available models
 */
const mistralProvider: ProviderInfo = {
  id: 'mistral',
  name: 'Mistral AI',
  icon: 'mistralai.png',
  description: 'Mistral AI language and embedding models including Mistral, Mixtral and Pixtral',
  languageModels: [
    { id: 'ministral-3b-latest', name: 'Ministral 3B', description: 'Latest Ministral 3B model' },
    { id: 'ministral-8b-latest', name: 'Ministral 8B', description: 'Latest Ministral 8B model' },
    { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Latest large model' },
    { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Latest small model' },
    {
      id: 'pixtral-large-latest',
      name: 'Pixtral Large',
      description: 'Latest Pixtral large model',
    },
    { id: 'pixtral-12b-2409', name: 'Pixtral 12B', description: 'Pixtral 12B model' },
    { id: 'open-mistral-7b', name: 'Open Mistral 7B', description: 'Open source 7B model' },
    {
      id: 'open-mixtral-8x7b',
      name: 'Open Mixtral 8x7B',
      description: 'Open source Mixtral model',
    },
    {
      id: 'open-mixtral-8x22b',
      name: 'Open Mixtral 8x22B',
      description: 'Large open source Mixtral model',
    },
  ],
  textEmbeddingModels: [
    {
      id: 'mistral-embed',
      name: 'Mistral Embed',
      description: 'Mistral embedding model',
      dimensions: 1024,
    },
  ],
  imageModels: [],
}

export default mistralProvider
