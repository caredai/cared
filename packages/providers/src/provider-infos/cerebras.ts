import type { ProviderInfo } from '../types'

/**
 * Cerebras provider information including all available models
 */
const cerebrasProvider: ProviderInfo = {
  id: 'cerebras',
  name: 'Cerebras',
  icon: 'cerebras.png',
  description: 'Cerebras AI platform offering specialized language models',
  languageModels: [
    {
      id: 'cerebras/Cerebras-GPT-13B-v1.0',
      name: 'Cerebras GPT 13B',
      description: 'Cerebras GPT model with 13B parameters',
    },
    {
      id: 'cerebras/Cerebras-GPT-4.8B-v1.0',
      name: 'Cerebras GPT 4.8B',
      description: 'Cerebras GPT model with 4.8B parameters',
    },
    {
      id: 'cerebras/Cerebras-GPT-2.7B-v1.0',
      name: 'Cerebras GPT 2.7B',
      description: 'Cerebras GPT model with 2.7B parameters',
    },
    {
      id: 'cerebras/Cerebras-GPT-1.3B-v1.0',
      name: 'Cerebras GPT 1.3B',
      description: 'Cerebras GPT model with 1.3B parameters',
    },
    {
      id: 'cerebras/Cerebras-GPT-590M-v1.0',
      name: 'Cerebras GPT 590M',
      description: 'Cerebras GPT model with 590M parameters',
    },
    {
      id: 'cerebras/Cerebras-GPT-256M-v1.0',
      name: 'Cerebras GPT 256M',
      description: 'Cerebras GPT model with 256M parameters',
    },
    {
      id: 'cerebras/Cerebras-GPT-111M-v1.0',
      name: 'Cerebras GPT 111M',
      description: 'Cerebras GPT model with 111M parameters',
    },
  ],
  textEmbeddingModels: [],
  imageModels: [],
}

export default cerebrasProvider
