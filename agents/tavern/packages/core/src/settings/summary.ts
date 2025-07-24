import { z } from 'zod/v4'

import { ExtensionInjectionPosition } from '../extension'

export interface SummarySettings {
  disabled: boolean // Whether the summary feature is disabled.

  auto: boolean // Whether to automatically build summaries.
  skipWIAN: boolean // Omit Lorebook and Author's Note from text to be summarized.

  buildingMode: SummaryBuildingMode
  prompt: string

  targetWords: number
  overrideResponseMaxTokens: number // 0 means no override

  maxMessagesPerRequest: number // 0 means no limit

  messagesInterval: number // 0 means disabled
  wordsInterval: number // 0 means disabled

  injectionTemplate: string
  inWIScan: boolean // Include in Lorebook Scanning
  injectionPosition: ExtensionInjectionPosition
  depth: number
  role: 'system' | 'user' | 'assistant'
}

export enum SummaryBuildingMode {
  DEFAULT = 0,
  RAW_BLOCKING = 1,
  RAW_NON_BLOCKING = 2,
}

export const summarySettingsSchema = z.object({
  disabled: z.boolean(),

  auto: z.boolean(),
  skipWIAN: z.boolean(),

  buildingMode: z.enum(SummaryBuildingMode),
  prompt: z.string(),

  targetWords: z.number().int().min(25).max(1000).step(25),
  overrideResponseMaxTokens: z.number().int().min(0).max(4096).step(16),

  maxMessagesPerRequest: z.number().int().min(0).max(250).step(1),

  messagesInterval: z.number().int().min(0).max(250).step(1),
  wordsInterval: z.number().int().min(0).max(10000).step(100),

  injectionTemplate: z.string(),
  inWIScan: z.boolean(),
  injectionPosition: z.enum(ExtensionInjectionPosition),
  depth: z.number().int().min(0).step(1),
  role: z.enum(['system', 'user', 'assistant']),
})

const defaultPrompt =
  'Ignore previous instructions. Summarize the most important facts and events in the story so far. If a summary already exists in your memory, use that as a base and expand with new facts. Limit the summary to {{words}} words or less. Your response should include nothing but the summary.'
const defaultInjectionTemplate = '[Summary: {{summary}}]'

export function fillInSummarySettingsWithDefaults(settings?: SummarySettings): SummarySettings {
  return (
    settings ?? {
      disabled: false,
      auto: true,
      skipWIAN: false,
      buildingMode: SummaryBuildingMode.DEFAULT,
      prompt: defaultPrompt,
      targetWords: 200,
      overrideResponseMaxTokens: 0,
      maxMessagesPerRequest: 0,
      messagesInterval: 10,
      wordsInterval: 0,
      injectionTemplate: defaultInjectionTemplate,
      inWIScan: false,
      injectionPosition: ExtensionInjectionPosition.IN_PROMPT,
      depth: 2,
      role: 'system',
    }
  )
}
