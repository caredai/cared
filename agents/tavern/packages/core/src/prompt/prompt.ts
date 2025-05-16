import { z } from 'zod'

/**
 * Represents a prompt.
 */
export interface Prompt {
  /**
   * Unique identifier for the prompt
   */
  identifier: string

  /**
   * Role of the prompt (e.g. 'system', 'user', etc.)
   */
  role?: string

  /**
   * The actual content/text of the prompt
   */
  content?: string

  /**
   * Display name of the prompt
   */
  name: string

  /**
   * Whether this is a system-level prompt
   */
  system_prompt: boolean

  /**
   * Position of the prompt in the sequence
   */
  position?: string

  /**
   * Position where the prompt should be injected
   */
  injection_position?: number

  /**
   * Depth level for prompt injection
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

export interface PromptOrder {
  identifier: string
  enabled: boolean
}

export const promptSchema = z.object({
  identifier: z.string(),
  role: z.string().optional(),
  content: z.string().optional(),
  name: z.string(),
  system_prompt: z.boolean(),
  position: z.string().optional(),
  injection_position: z.number().optional(),
  injection_depth: z.number().optional(),
  forbid_overrides: z.boolean().optional(),
  extension: z.boolean().optional(),
})

export const promptOrderSchema = z.object({
  identifier: z.string(),
  enabled: z.boolean(),
})
