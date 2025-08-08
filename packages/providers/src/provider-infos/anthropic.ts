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
      id: 'claude-opus-4-1-20250805',
      name: 'Claude Opus 4.1',
      description: 'Latest Claude Opus model with enhanced capabilities',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '15.00',
      cacheInputTokenPrice: {
        '5m': '18.75',
        '1h': '30.00',
      },
      cachedInputTokenPrice: '1.50',
      outputTokenPrice: '75.00',
    },
    {
      id: 'claude-opus-4-20250514',
      name: 'Claude Opus 4',
      description: 'Most capable Claude model for complex reasoning tasks',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '15.00',
      cacheInputTokenPrice: {
        '5m': '18.75',
        '1h': '30.00',
      },
      cachedInputTokenPrice: '1.50',
      outputTokenPrice: '75.00',
    },
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      description: 'Balanced Claude model for general tasks',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '3.00',
      cacheInputTokenPrice: {
        '5m': '3.75',
        '1h': '6.00',
      },
      cachedInputTokenPrice: '0.30',
      outputTokenPrice: '15.00',
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude Sonnet 3.7',
      description: 'Enhanced Claude Sonnet model',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '3.00',
      cacheInputTokenPrice: {
        '5m': '3.75',
        '1h': '6.00',
      },
      cachedInputTokenPrice: '0.30',
      outputTokenPrice: '15.00',
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude Sonnet 3.5',
      description: 'Fast and efficient Claude Sonnet model',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '3.00',
      cacheInputTokenPrice: {
        '5m': '3.75',
        '1h': '6.00',
      },
      cachedInputTokenPrice: '0.30',
      outputTokenPrice: '15.00',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude Haiku 3.5',
      description: 'Fast and cost-effective Claude model',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '0.80',
      cacheInputTokenPrice: {
        '5m': '1.00',
        '1h': '1.60',
      },
      cachedInputTokenPrice: '0.08',
      outputTokenPrice: '4.00',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude Opus 3',
      description: 'Previous generation Claude Opus model',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '15.00',
      cacheInputTokenPrice: {
        '5m': '18.75',
        '1h': '30.00',
      },
      cachedInputTokenPrice: '1.50',
      outputTokenPrice: '75.00',
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude Haiku 3',
      description: 'Fast and lightweight Claude model',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputTokenPrice: '0.25',
      cacheInputTokenPrice: {
        '5m': '0.30',
        '1h': '0.50',
      },
      cachedInputTokenPrice: '0.03',
      outputTokenPrice: '1.25',
    },
  ],
}

export default anthropicProvider
