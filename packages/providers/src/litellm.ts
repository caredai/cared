export interface LiteLLMModelInfo {
  max_tokens?: number
  max_input_tokens?: number
  max_output_tokens?: number
  input_cost_per_token?: number
  output_cost_per_token?: number
  cache_read_input_token_cost?: number
  litellm_provider: string
  mode?:
    | 'moderation'
    | 'chat'
    | 'completion'
    | 'embedding'
    | 'image_generation'
    | 'audio_transcription'
    | 'audio_speech'
    | 'rerank'
  supports_function_calling?: boolean
  supports_parallel_function_calling?: boolean
  supports_vision?: boolean
  supports_audio_input?: boolean
  supports_audio_output?: boolean
  supports_prompt_caching?: boolean
  supports_response_schema?: boolean
  supports_system_messages?: boolean
  deprecation_date?: string // e.g., "2025-06-01"
}

export async function getLiteLLMModels() {
  const r = await (
    await fetch(
      'https://github.com/BerriAI/litellm/raw/refs/heads/main/model_prices_and_context_window.json',
      {
        // @ts-ignore
        cache: 'force-cache',
        next: {
          revalidate: 7200,
          tags: ['litellm-models'],
        },
      },
    )
  ).json()
  const modelInfos = r as Record<string, LiteLLMModelInfo>
  const modelsByProvider = new Map<string, Record<string, LiteLLMModelInfo>>()
  for (const [modelId, v] of Object.entries(modelInfos)) {
    let models = modelsByProvider.get(v.litellm_provider)
    if (!models) {
      models = {}
      modelsByProvider.set(v.litellm_provider, models)
    }
    models[modelId] = v
  }
  const result: Record<string, Record<string, LiteLLMModelInfo>> = {}
  for (const [providerId, models] of modelsByProvider) {
    const process = () => {
      const processed: typeof models = {}
      for (const [modelId, modelInfo] of Object.entries(models)) {
        processed[stripPrefix(modelId)] = modelInfo
      }
      if (providerId === 'gemini') {
        result.google = processed
      } else if (providerId === 'together_ai') {
        result.togetherai = processed
      } else if (providerId === 'fireworks_ai') {
        result.fireworks = processed
      } else {
        result[providerId] = processed
      }
    }

    if (providerIds.includes(providerId)) {
      result[providerId] = models
    } else if (providerId.startsWith('vertex_ai')) {
      process()
    } else {
      switch (providerId) {
        case 'deepseek':
        case 'gemini':
        case 'mistral':
        case 'xai':
        case 'together_ai':
        case 'fireworks_ai':
        case 'deepinfra':
        case 'groq':
        case 'replicate':
        case 'perplexity':
          process()
          break
        default:
        // nothing
      }
    }
  }
  // providerId -> modelId -> modelInfo
  return result
}

function stripPrefix(s: string, separator = '/') {
  const [, b] = s.split(separator, 2)
  return b ? b : s
}

const providerIds = [
  'openai',
  'anthropic',
  // 'deepseek',
  // 'azure', // TODO: need special handling
  'bedrock',
  // 'google',
  // 'vertex',
  // 'mistral',
  // 'xai',
  // 'togetherai',
  'cohere',
  // 'fireworks',
  // 'deepinfra',
  // 'cerebras', // no matched models
  // 'groq',
  // 'replicate',
  // 'perplexity',
  // 'luma', // no matched models
]
