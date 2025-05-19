import { z } from 'zod'

import { Prompt, promptListSchema } from '../prompt'
import { promptSchema } from '../prompt'

export * from './defaults'

export interface ModelPreset {
  /**
   The maximum number of tokens that will be sent as the prompt.
   */
  maxContext?: number
  /**
   Maximum number of tokens to generate.
   */
  maxTokens?: number
  /**
   Temperature setting. This is a number between 0 (almost no randomness) and
   1 (very random).

   It is recommended to set either `temperature` or `topP`, but not both.

   @default 0
   */
  temperature?: number

  /**
   Nucleus sampling. This is a number between 0 and 1.

   E.g. 0.1 would mean that only tokens with the top 10% probability mass
   are considered.

   It is recommended to set either `temperature` or `topP`, but not both.
   */
  topP?: number

  /**
   Only sample from the top K options for each subsequent token.

   Used to remove "long tail" low probability responses.
   Recommended for advanced use cases only. You usually only need to use temperature.
   */
  topK?: number

  /**
   Presence penalty setting. It affects the likelihood of the model to
   repeat information that is already in the prompt.

   The presence penalty is a number between -1 (increase repetition)
   and 1 (maximum penalty, decrease repetition). 0 means no penalty.
   */
  presencePenalty?: number

  /**
   Frequency penalty setting. It affects the likelihood of the model
   to repeatedly use the same words or phrases.

   The frequency penalty is a number between -1 (increase repetition)
   and 1 (maximum penalty, decrease repetition). 0 means no penalty.
   */
  frequencyPenalty?: number
  /**
   Stop sequences.
   If set, the model will stop generating text when one of the stop sequences is generated.
   Providers may have limits on the number of stop sequences.
   */
  stopSequences?: string[]
  /**
   The seed (integer) to use for random sampling. If set and supported
   by the model, calls will generate deterministic results.
   */
  seed?: number

  /**
   * Disable sending attachments to model.
   */
  disableSendingAttachments?: boolean
  /**
   * Disable all tool calls.
   */
  disableTools?: boolean
  /**
   * Disable sending reasoning from model.
   */
  disableSendingReasoning?: boolean

  characterNameBehavior?: 'none' | 'default' | 'completion' | 'content'
  continuePostfix?: 'none' | 'space' | 'newline' | 'double-newline'
  wrapInQuotes?: boolean
  continuePrefill?: boolean
  squashSystemMessages?: boolean

  utilityPrompts: {
    impersonationPrompt: string
    newChatPrompt: string
    newGroupChatPrompt: string
    newExampleChatPrompt: string
    continueNudgePrompt: string
    groupNudgePrompt: string
    worldInfoFormat: string
    scenarioFormat: string
    personalityFormat: string
    sendIfEmpty: string
  }

  prompts: Prompt[]

  vendor?: {
    openrouter?: {
      middleout?: 'on' | 'off' | 'auto'
    }
    claude?: {
      assistantPrefill?: string
      assistantImpersonation?: string
      useSysPrompt?: boolean
    }
  }
}

export const modelPresetSchema = z.object({
  maxContext: z.number().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
  stopSequences: z.array(z.string()).optional(),
  seed: z.number().optional(),
  disableSendingAttachments: z.boolean().optional(),
  disableTools: z.boolean().optional(),
  disableSendingReasoning: z.boolean().optional(),

  characterNameBehavior: z.enum(['none', 'default', 'completion', 'content']).optional(),
  continuePostfix: z.enum(['none', 'space', 'newline', 'double-newline']).optional(),
  wrapInQuotes: z.boolean().optional(),
  continuePrefill: z.boolean().optional(),
  squashSystemMessages: z.boolean().optional(),

  utilityPrompts: z.object({
    impersonationPrompt: z.string(),
    newChatPrompt: z.string(),
    newGroupChatPrompt: z.string(),
    newExampleChatPrompt: z.string(),
    continueNudgePrompt: z.string(),
    groupNudgePrompt: z.string(),
    worldInfoFormat: z.string(),
    scenarioFormat: z.string(),
    personalityFormat: z.string(),
    sendIfEmpty: z.string(),
  }),

  prompts: promptListSchema,

  vendor: z
    .object({
      openrouter: z
        .object({
          middleout: z.enum(['on', 'off', 'auto']).optional(),
        })
        .optional(),
      claude: z
        .object({
          assistantPrefill: z.string().optional(),
          assistantImpersonation: z.string().optional(),
          useSysPrompt: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
})
