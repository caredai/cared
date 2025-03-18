import type { ProviderInfo } from '../types'

/**
 * xAI provider information including all available Grok models
 */
const xaiProvider: ProviderInfo = {
  id: 'xai',
  name: 'xAI',
  icon: 'x.svg',
  description: 'xAI Grok language models with general and vision capabilities',
  languageModels: [
    { id: 'grok-2-1212', name: 'Grok 2', description: 'Grok 2 base model' },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', description: 'Vision-capable Grok 2' },
    { id: 'grok-beta', name: 'Grok Beta', description: 'Beta version of Grok' },
    {
      id: 'grok-vision-beta',
      name: 'Grok Vision Beta',
      description: 'Beta version with vision capabilities',
    },
  ],
  textEmbeddingModels: [],
  imageModels: [],
}

export default xaiProvider
