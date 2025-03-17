import type { ModelInfo } from './types'

export const OPENROUTER_AUTO_ID = 'openrouter/auto'
export const OPENROUTER_AUTO_VALUE = '-1'
type OpenRouterAutoValue = typeof OPENROUTER_AUTO_VALUE

export interface OpenRouterModelInfo extends ModelInfo {
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
  return (r as any).data as OpenRouterModelInfo[]
}
