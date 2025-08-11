import { Decimal } from 'decimal.js'

import type { LanguageModelInfo } from './types'

export const OPENROUTER_AUTO_ID = 'openrouter/auto'
export const OPENROUTER_AUTO_VALUE = '-1'
type OpenRouterAutoValue = typeof OPENROUTER_AUTO_VALUE

export interface OpenRouterModelInfo extends LanguageModelInfo {
  created: number // unix timestamp, in seconds
  context_length: number
  architecture: {
    modality: 'text->text' | 'text+image->text' | string
    tokenizer: string
    instruct_type?: string
  }
  pricing: {
    prompt: string | OpenRouterAutoValue // decimal string, in $USD/input token; * 1e6 = $USD/M input tokens
    completion: string | OpenRouterAutoValue // decimal string, in $USD/output token; * 1e6 = $USD/M output tokens
    input_cache_read: string | OpenRouterAutoValue
    input_cache_write: string | OpenRouterAutoValue
  }
  top_provider: {
    context_length: number
    max_completion_tokens?: number
    is_moderated: boolean
  }
  per_request_limits?: null
}

export async function getOpenRouterModels() {
  const r = await (
    await fetch('https://openrouter.ai/api/v1/models', {
      // @ts-ignore
      cache: 'force-cache',
      next: {
        revalidate: 7200,
        tags: ['openrouter-models'],
      },
    })
  ).json()
  const models = (r as any).data as OpenRouterModelInfo[]

  for (const model of models) {
    model.contextWindow = regulateNumber(model.context_length)
    model.maxOutputTokens = regulateNumber(model.top_provider.max_completion_tokens)
    model.inputTokenPrice = formatPrice(model.pricing.prompt)
    model.cachedInputTokenPrice = formatPrice(model.pricing.input_cache_read)
    model.cacheInputTokenPrice = formatPrice(model.pricing.input_cache_write)
    model.outputTokenPrice = formatPrice(model.pricing.completion)
  }

  return models
}

function regulateNumber(value?: number | string) {
  try {
    if (typeof value === 'undefined') {
      return
    }
    const num = Number(value)
    return !isNaN(num) ? num : undefined
  } catch {
    return
  }
}

function formatPrice(price: string) {
  try {
    const p = new Decimal(price).times(Decimal.pow(10, 6))
    if (p.isPositive()) {
      return p.toString()
    } else {
      return '0.00' // free
    }
  } catch {
    return
  }
}
