export const default_main_prompt =
  "Write {{char}}'s next reply in a fictional chat between {{charIfNotGroup}} and {{user}}."
export const default_nsfw_prompt = ''
export const default_jailbreak_prompt = ''
export const default_impersonation_prompt =
  "[Write your next reply from the point of view of {{user}}, using the chat history so far as a guideline for the writing style of {{user}}. Don't write as {{char}} or system. Don't describe actions of {{char}}.]"
export const default_enhance_definitions_prompt =
  "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute."
export const default_wi_format = '{0}'
export const default_new_chat_prompt = '[Start a new Chat]'
export const default_new_group_chat_prompt = '[Start a new group chat. Group members: {{group}}]'
export const default_new_example_chat_prompt = '[Example Chat]'
export const default_continue_nudge_prompt =
  '[Continue your last message without repeating its original content.]'
export const default_bias = 'Default (none)'
export const default_personality_format = '{{personality}}'
export const default_scenario_format = '{{scenario}}'
export const default_group_nudge_prompt = '[Write the next reply only as {{char}}.]'

export const defaultPrompts = [
  {
    name: 'Main Prompt',
    system_prompt: true,
    role: 'system',
    content:
      "Write {{char}}'s next reply in a fictional chat between {{charIfNotGroup}} and {{user}}.",
    identifier: 'main',
  },
  {
    name: 'Auxiliary Prompt',
    system_prompt: true,
    role: 'system',
    content: '',
    identifier: 'nsfw',
  },
  {
    identifier: 'dialogueExamples',
    name: 'Chat Examples',
    system_prompt: true,
    marker: true,
  },
  {
    name: 'Post-History Instructions',
    system_prompt: true,
    role: 'system',
    content: '',
    identifier: 'jailbreak',
  },
  {
    identifier: 'chatHistory',
    name: 'Chat History',
    system_prompt: true,
    marker: true,
  },
  {
    identifier: 'worldInfoAfter',
    name: 'World Info (after)',
    system_prompt: true,
    marker: true,
  },
  {
    identifier: 'worldInfoBefore',
    name: 'World Info (before)',
    system_prompt: true,
    marker: true,
  },
  {
    identifier: 'enhanceDefinitions',
    role: 'system',
    name: 'Enhance Definitions',
    content:
      "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
    system_prompt: true,
    marker: false,
  },
  {
    identifier: 'charDescription',
    name: 'Char Description',
    system_prompt: true,
    marker: true,
  },
  {
    identifier: 'charPersonality',
    name: 'Char Personality',
    system_prompt: true,
    marker: true,
  },
  {
    identifier: 'scenario',
    name: 'Scenario',
    system_prompt: true,
    marker: true,
  },
  {
    identifier: 'personaDescription',
    name: 'Persona Description',
    system_prompt: true,
    marker: true,
  },
]

export const defaultPromptOrder = [
  {
    identifier: 'main',
    enabled: true,
  },
  {
    identifier: 'worldInfoBefore',
    enabled: true,
  },
  {
    identifier: 'personaDescription',
    enabled: true,
  },
  {
    identifier: 'charDescription',
    enabled: true,
  },
  {
    identifier: 'charPersonality',
    enabled: true,
  },
  {
    identifier: 'scenario',
    enabled: true,
  },
  {
    identifier: 'enhanceDefinitions',
    enabled: false,
  },
  {
    identifier: 'nsfw',
    enabled: true,
  },
  {
    identifier: 'worldInfoAfter',
    enabled: true,
  },
  {
    identifier: 'dialogueExamples',
    enabled: true,
  },
  {
    identifier: 'chatHistory',
    enabled: true,
  },
  {
    identifier: 'jailbreak',
    enabled: true,
  },
]
