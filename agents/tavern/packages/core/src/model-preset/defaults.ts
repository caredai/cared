import type { ModelPreset } from '.'
import {
  default_continue_nudge_prompt,
  default_group_nudge_prompt,
  default_impersonation_prompt,
  default_new_chat_prompt,
  default_new_example_chat_prompt,
  default_new_group_chat_prompt,
  default_personality_format,
  default_scenario_format,
  default_wi_format,
  defaultOrderedPrompts,
} from '../prompt'

export const defaultModelPreset: ModelPreset = {
  maxContext: 4095,
  maxTokens: 300,
  temperature: 1,
  topP: 1,
  topK: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
  seed: -1,
  disableSendingAttachments: true,
  disableTools: true,
  disableSendingReasoning: false,

  characterNameBehavior: 'default',
  continuePostfix: 'space',
  wrapInQuotes: false,
  continuePrefill: false,
  squashSystemMessages: false,

  utilityPrompts: {
    impersonationPrompt: default_impersonation_prompt,
    newChatPrompt: default_new_chat_prompt,
    newGroupChatPrompt: default_new_group_chat_prompt,
    newExampleChatPrompt: default_new_example_chat_prompt,
    continueNudgePrompt: default_continue_nudge_prompt,
    groupNudgePrompt: default_group_nudge_prompt,
    worldInfoFormat: default_wi_format,
    scenarioFormat: default_scenario_format,
    personalityFormat: default_personality_format,
    sendIfEmpty: '',
  },

  prompts: defaultOrderedPrompts,

  vendor: {
    openrouter: {
      middleout: 'on',
    },
    claude: {
      useSysPrompt: false,
    },
  },
}
