import type { JSONValue } from 'ai'
import { z } from 'zod/v4'

import type { ProviderId } from '@cared/providers'

import type { AnthropicProviderOptions } from '@ai-sdk/anthropic'

// https://openrouter.ai/docs/use-cases/reasoning-tokens
export const OpenRouterReasoningOptionsSchema = z
  .object({
    enabled: z.boolean().optional(),
    exclude: z.boolean().optional(),
  })
  .and(
    z.union([
      z.object({
        max_tokens: z.number(),
      }),
      z.object({
        effort: z.enum(['low', 'medium', 'high']),
      }),
    ]),
  )
  .optional()

export function getReasoningOptions(
  providerId: ProviderId,
  maxOutputTokens?: number,
  openaiReasoning?: 'high' | 'medium' | 'low' | null,
  openrouterOptions?: z.infer<typeof OpenRouterReasoningOptionsSchema>,
): Record<string, JSONValue> | undefined {
  if (openaiReasoning) {
    openrouterOptions = {
      effort: openaiReasoning,
    }
  }

  if (!openrouterOptions || openrouterOptions.enabled === false) {
    return
  }

  // https://openrouter.ai/docs/use-cases/reasoning-tokens#reasoning-max-tokens-for-anthropic-models
  let budgetTokens: number | undefined
  if ('max_tokens' in openrouterOptions) {
    budgetTokens = openrouterOptions.max_tokens
  } else if (maxOutputTokens) {
    const effortRatio =
      openrouterOptions.effort === 'high' ? 0.8 : openrouterOptions.effort === 'medium' ? 0.5 : 0.2
    budgetTokens = Math.floor(Math.max(Math.min(maxOutputTokens * effortRatio, 32000), 1024))
  }

  switch (providerId) {
    case 'openrouter':
      return {
        reasoning: openrouterOptions,
      }
    case 'openai':
    case 'azure': {
      let effort
      if ('effort' in openrouterOptions) {
        effort = openrouterOptions.effort
      } else if (openrouterOptions.enabled) {
        // https://openrouter.ai/docs/use-cases/reasoning-tokens#enable-reasoning-with-default-config
        effort = 'medium'
      } else if (maxOutputTokens) {
        // https://openrouter.ai/docs/use-cases/reasoning-tokens#reasoning-effort-level
        const effortRatio = openrouterOptions.max_tokens / maxOutputTokens
        if (effortRatio >= 0.8) {
          effort = 'high'
        } else if (effortRatio >= 0.5) {
          effort = 'medium'
        } else if (effortRatio >= 0.2) {
          effort = 'low'
        }
      }
      return effort
        ? {
            reasoningEffort: effort,
          }
        : undefined
    }
    case 'anthropic': {
      return {
        thinking: { type: 'enabled', budgetTokens },
      } satisfies AnthropicProviderOptions as Record<string, JSONValue>
    }
    case 'google':
    case 'vertex': {
      return {
        thinkingConfig: {
          thinkingBudget: budgetTokens,
          includeThoughts: openrouterOptions.exclude,
        },
      } as Record<string, JSONValue>
    }
    case 'bedrock': {
      return {
        reasoningConfig: { type: 'enabled', budgetTokens },
      } as Record<string, JSONValue>
    }
  }
}
