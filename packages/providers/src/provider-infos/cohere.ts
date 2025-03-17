import type { ProviderInfo } from '../types'

/**
 * Cohere provider information including all available models
 */
const cohereProvider: ProviderInfo = {
  id: 'cohere',
  name: 'Cohere',
  icon: 'cohere.svg',
  description: 'Cohere platform offering advanced language models for various applications',
  languageModels: [
    {
      id: 'command-r-plus',
      name: 'Command R+',
      description: 'Most powerful Cohere model with enhanced reasoning capabilities',
    },
    {
      id: 'command-r',
      name: 'Command R',
      description: 'Advanced reasoning model for complex tasks',
    },
    {
      id: 'command-light',
      name: 'Command Light',
      description: 'Lightweight and efficient model for faster responses',
    },
    {
      id: 'command',
      name: 'Command',
      description: 'General purpose model for various tasks',
    },
  ],
  textEmbeddingModels: [
    {
      id: 'embed-english-v3.0',
      name: 'Embed English v3.0',
      description: 'Latest English embedding model',
      dimensions: 1024,
    },
    {
      id: 'embed-english-light-v3.0',
      name: 'Embed English Light v3.0',
      description: 'Lightweight English embedding model',
      dimensions: 384,
    },
    {
      id: 'embed-multilingual-v3.0',
      name: 'Embed Multilingual v3.0',
      description: 'Multilingual embedding model supporting 100+ languages',
      dimensions: 1024,
    },
    {
      id: 'embed-multilingual-light-v3.0',
      name: 'Embed Multilingual Light v3.0',
      description: 'Lightweight multilingual embedding model',
      dimensions: 384,
    },
    {
      id: 'embed-english-v2.0',
      name: 'Embed English v2.0',
      description: 'Previous generation English embedding model',
      dimensions: 4096,
    },
    {
      id: 'embed-english-light-v2.0',
      name: 'Embed English Light v2.0',
      description: 'Previous generation lightweight English embedding model',
      dimensions: 1024,
    },
    {
      id: 'embed-multilingual-v2.0',
      name: 'Embed Multilingual v2.0',
      description: 'Previous generation multilingual embedding model',
      dimensions: 768,
    },
  ],
  imageModels: [],
}

export default cohereProvider 