import { z } from 'zod/v4'

/**
 * Represents a prompt.
 */
export interface Prompt {
  /**
   * Unique identifier for the prompt
   * `systemPromptIdentifiers` are used as identifiers for system prompts
   * Non-system prompts should use uuid as identifier
   */
  identifier: string

  /**
   * Whether the prompt is enabled
   */
  enabled: boolean

  /**
   * Display name of the prompt
   */
  name: string

  /**
   * Whether this is a system-level prompt
   * System prompts can not be deleted
   */
  system_prompt: boolean

  /**
   * Whether this is a marker prompt
   */
  marker: boolean

  /**
   * Role of the prompt (e.g. 'system', 'user', etc.)
   * Only used for non-marker prompts
   */
  role?: 'system' | 'user' | 'assistant'

  /**
   * The actual content/text of the prompt
   * Only used for non-marker prompts
   */
  content?: string

  /**
   * Position where the prompt should be injected
   */
  injection_position?: 'relative' | 'absolute'

  /**
   * Depth level for prompt injection
   * Only used for absolute injection position
   */
  injection_depth?: number

  /**
   * Whether this prompt can be overridden
   */
  forbid_overrides?: boolean

  /**
   * Whether this prompt is added by an extension
   */
  extension?: boolean
}

export const promptSchema = z.object({
  identifier: z.string().min(1),
  enabled: z.boolean(),
  name: z.string(),
  system_prompt: z.boolean(),
  marker: z.boolean(),
  role: z.enum(['system', 'user', 'assistant']).optional(),
  content: z.string().optional(),
  injection_position: z.enum(['relative', 'absolute']).optional(),
  injection_depth: z.number().int().min(0).optional(),
  forbid_overrides: z.boolean().optional(),
  extension: z.boolean().optional(),
})

export const promptListSchema = z
  .array(
    promptSchema.superRefine(
      (
        { identifier, system_prompt, marker, role, content, injection_position, injection_depth },
        ctx,
      ) => {
        if (system_prompt && !systemPromptIdentifiers.includes(identifier)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'System prompt identifier must be one of the predefined system prompt identifiers',
            fatal: true,
          })
          return z.NEVER
        }
        if (!system_prompt && systemPromptIdentifiers.includes(identifier)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'System prompt identifier must not be used for non-system prompts',
            fatal: true,
          })
          return z.NEVER
        }

        if (!marker && !(typeof role === 'string' && typeof content === 'string')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Role and content must be defined for non-marker prompts',
            fatal: true,
          })
          return z.NEVER
        }
        if (marker && (typeof role === 'string' || typeof content === 'string')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Role and content must not be defined for marker prompts',
            fatal: true,
          })
          return z.NEVER
        }

        if (injection_position !== 'absolute' && typeof injection_depth === 'number') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Injection depth must not be defined for relative injection position',
            fatal: true,
          })
          return z.NEVER
        }
        if (injection_position === 'absolute' && typeof injection_depth !== 'number') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Injection depth must be defined for absolute injection position',
            fatal: true,
          })
          return z.NEVER
        }
        if (injection_position === 'absolute' && system_prompt && !marker) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'System non-marker prompts must not have absolute injection position',
            fatal: true,
          })
          return z.NEVER
        }

        return z.NEVER
      },
    ),
  )
  .superRefine((prompts, ctx) => {
    const identifiers = new Set(prompts.map((prompt) => prompt.identifier))
    if (!systemPromptIdentifiers.every((identifier) => identifiers.has(identifier))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'All system prompt identifiers must be present',
        fatal: true,
      })
      return z.NEVER
    }

    return z.NEVER
  })

export const systemPromptIdentifiers = [
  'main',
  'nsfw',
  'dialogueExamples',
  'jailbreak',
  'chatHistory',
  'worldInfoAfter',
  'worldInfoBefore',
  'enhanceDefinitions',
  'charDescription',
  'charPersonality',
  'scenario',
  'personaDescription',
]
