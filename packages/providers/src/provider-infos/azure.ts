import type { ProviderInfo } from '../types'

/**
 * Azure OpenAI Service provider information
 */
const azureProvider: ProviderInfo = {
  // @ts-ignore
  id: 'azure',
  name: 'Azure OpenAI Service',
  icon: 'azure_openai.svg',
  description: 'Microsoft Azure OpenAI Service for enterprise-grade AI deployments',
  languageModels: [],
  textEmbeddingModels: [],
  imageModels: [],
}

export default azureProvider
