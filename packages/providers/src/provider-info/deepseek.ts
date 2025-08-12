import type { ProviderInfo } from '../types'

/**
 * DeepSeek AI provider information including all available models
 */
const deepseekProvider: ProviderInfo = {
  id: 'deepseek',
  name: 'DeepSeek AI',
  icon: 'deepseek.svg',
  description: 'DeepSeek AI language models for general purpose and specialized reasoning',
  languageModels: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'General purpose chat model' },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner',
      description: 'Specialized reasoning model',
    },
  ],
  textEmbeddingModels: [],
  imageModels: [],
}

export default deepseekProvider
